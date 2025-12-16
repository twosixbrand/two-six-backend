import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CheckoutDto } from './dto/checkout.dto';

import { MailerService } from '@nestjs-modules/mailer';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private readonly mailerService: MailerService,
    private configService: ConfigService,
  ) { }

  async checkout(checkoutDto: CheckoutDto) {
    const { customer, items, total, shippingCost } = checkoutDto;

    const order = await this.prisma.$transaction(async (prisma) => {
      // 1. Find or Create Customer
      let customerRecord = await prisma.customer.findUnique({
        where: { email: customer.email },
      });

      if (!customerRecord) {
        customerRecord = await prisma.customer.create({
          data: {
            name: customer.name,
            email: customer.email,
            current_phone_number: customer.phone,
            shipping_address: customer.address,
            city: customer.city,
            state: customer.department,
            postal_code: '000000', // Default
            country: 'Colombia',
            responsable_for_vat: false,
            id_customer_type: 1, // Default: Natural
            id_identification_type: 1, // Default: CC
          },
        });
      } else {
        // Update address if needed (optional, but good for guest checkout)
        await prisma.customer.update({
          where: { id: customerRecord.id },
          data: {
            shipping_address: customer.address,
            city: customer.city,
            state: customer.department,
            current_phone_number: customer.phone,
          },
        });
      }

      // 2. Calculate Totals
      const ivaRate = 0.19;
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const iva = subtotal * ivaRate; // Approximation

      // 3. Create Order
      const order = await prisma.order.create({
        data: {
          id_customer: customerRecord.id,
          order_date: new Date(),
          status: 'Pendiente',
          iva: iva,
          shipping_cost: shippingCost,
          total_payment: total,
          purchase_date: new Date(),
          is_paid: false, // Payment integration would update this
          shipping_address: `${customer.address}, ${customer.city}, ${customer.department}`,
        },
      });

      // 4. Create Order Items and Update Stock
      for (const item of items) {
        // Create Order Item
        await prisma.orderItem.create({
          data: {
            id_order: order.id,
            id_product: item.productId,
            product_name: item.productName,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unit_price: item.price,
            iva_item: item.price * ivaRate,
          },
        });

        // Update Stock (Decrement available quantity)
        // First get the product to find the designClothing ID
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { designClothing: true },
        });

        if (product && product.designClothing) {
          await prisma.designClothing.update({
            where: { id: product.designClothing.id },
            data: {
              quantity_available: {
                decrement: item.quantity,
              },
              quantity_sold: {
                increment: item.quantity,
              },
            },
          });

          // Also update Stock table if it exists and is linked
          const stock = await prisma.stock.findUnique({
            where: { id_design_clothing: product.designClothing.id }
          });

          if (stock) {
            await prisma.stock.update({
              where: { id: stock.id },
              data: {
                available_quantity: { decrement: item.quantity },
                sold_quantity: { increment: item.quantity }
              }
            })
          }
        }
      }

      return order;
    });



    // Generar firma de integridad
    const integritySecret = this.configService.get<string>('WOMPI_INTEGRITY_SECRET');
    const publicKey = this.configService.get<string>('WOMPI_PUBLIC_KEY');

    if (!integritySecret) {
      throw new Error('WOMPI_INTEGRITY_SECRET no está configurado');
    }
    if (!publicKey) {
      throw new Error('WOMPI_PUBLIC_KEY no está configurado');
    }

    // 2. Concatenación EXACTA (Sin espacios adicionales - igual al ejemplo del usuario)
    // Nota: El usuario sugirió no usar trim(), así que usamos el secreto tal cual viene del env.
    const integritySecretRaw = integritySecret;

    // Validar formato de llaves (ayuda visual en logs)
    if (!integritySecretRaw.startsWith('test_integrity_') && !integritySecretRaw.startsWith('prod_integrity_')) {
      console.warn('ADVERTENCIA: WOMPI_INTEGRITY_SECRET no parece tener el formato correcto (debería empezar por test_integrity_ o prod_integrity_).');
    }

    const amountInCents = Math.round(total * 100);
    // Usar una referencia más única para evitar colisiones y posibles bloqueos
    const reference = `ORDER-${order.id}-${Date.now()}`;
    const currency = 'COP';

    const integrityString = `${reference}${amountInCents}${currency}${integritySecretRaw}`;

    const crypto = require('crypto');
    const signature = crypto.createHash('sha256').update(integrityString).digest('hex');

    return {
      order,
      wompi: {
        publicKey,
        currency,
        amountInCents,
        reference,
        integritySignature: signature
      }
    };
  }

  /**
   * Verifica una transacción de Wompi y actualiza la orden correspondiente.
   */
  async verifyPayment(transactionId: string) {
    console.log('Verifying payment for transactionId:', transactionId);

    if (!transactionId || transactionId === 'undefined' || transactionId === 'null') {
      throw new Error('Transaction ID inválido o no proporcionado');
    }

    try {
      // 1. Consultar la API de Wompi
      const wompiApiUrl = this.configService.get<string>('WOMPI_API_URL');
      console.log('WOMPI_API_URL:', wompiApiUrl);

      const response = await fetch(`${wompiApiUrl}/transactions/${transactionId}`);

      if (!response.ok) {
        throw new Error(`Error consultando Wompi: ${response.statusText}`);
      }

      const data = await response.json();
      const transaction = data.data;

      // 2. Obtener la referencia de la orden (orderId)
      // La referencia ahora es del tipo "ORDER-{id}-{timestamp}"
      const referenceParts = transaction.reference.split('-');
      let orderId: number;

      if (referenceParts.length >= 2 && referenceParts[0] === 'ORDER') {
        orderId = Number(referenceParts[1]);
      } else {
        // Fallback por si acaso llega solo el número (versiones viejas)
        orderId = Number(transaction.reference);
      }

      if (isNaN(orderId)) {
        throw new Error(`Referencia de orden inválida en la transacción de Wompi: ${transaction.reference}`);
      }

      // 3. Buscar la orden
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });

      if (!order) {
        throw new Error(`Orden #${orderId} no encontrada`);
      }
      console.log('Order found:', order.id);

      // 4. Verificar el estado
      // Estados de Wompi: APPROVED, DECLINED, VOIDED, ERROR
      if (transaction.status === 'APPROVED') {
        // Verificar el monto (opcional pero recomendado)
        const amountInCents = transaction.amount_in_cents;
        const orderTotalInCents = order.total_payment * 100;

        if (amountInCents < orderTotalInCents) {
          console.warn(`Alerta: El monto pagado (${amountInCents}) es menor al total de la orden (${orderTotalInCents})`);
        }

        // 3. Actualizar estado de la orden
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'Pagado',
            is_paid: true,
          },
        });

        // 4. Registrar el pago en la tabla Payments
        if (transaction.status === 'APPROVED') {
          // Verificar si ya existe un pago con esta referencia
          const existingPayment = await this.prisma.payments.findFirst({
            where: { transaction_reference: transaction.reference }
          });

          if (!existingPayment) {
            // Buscar método de pago (Wompi) o crear uno genérico si no existe
            let paymentMethod = await this.prisma.paymentMethod.findFirst({
              where: { name: 'Wompi' }
            });

            if (!paymentMethod) {
              paymentMethod = await this.prisma.paymentMethod.create({
                data: { name: 'Wompi', enabled: true }
              });
            }

            await this.prisma.payments.create({
              data: {
                id_order: orderId,
                id_customer: order.id_customer,
                id_payment_method: paymentMethod.id,
                status: transaction.status,
                transaction_date: new Date(transaction.created_at),
                transaction_reference: transaction.reference,
                amount: transaction.amount_in_cents / 100, // Convertir a pesos
              }
            });
          }
        }

        // Enviar correo de confirmación SOLO si el pago es aprobado Y no se ha enviado antes
        if (!order.is_paid) {
          try {
            const itemsHtml = order.orderItems.map(item => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; width: 60px;">
                <img src="${item.product.image_url || 'https://example.com/placeholder.png'}" alt="${item.product_name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">
                <div style="font-weight: bold;">${item.product_name}</div>
                <div style="font-size: 12px; color: #666;">Ref: ${item.id_product}</div>
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.size} / ${item.color}</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.unit_price.toLocaleString('es-CO')}</td>
            </tr>
          `).join('');

            await this.mailerService.sendMail({
              to: order.customer.email,
              subject: `Confirmación de Pedido #${order.id} - Two Six`,
              html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="text-align: center; padding: 20px; background-color: #f8f9fa;">
                  <h1 style="color: #000; margin: 0;">TWO SIX</h1>
                  <p style="color: #666; font-size: 14px; letter-spacing: 2px;">ESTILO Y CONFORT</p>
                </div>
                
                <div style="padding: 20px;">
                  <h2 style="color: #333;">¡Gracias por tu compra, ${order.customer.name}!</h2>
                  <p>Hemos recibido tu pago para el pedido <strong>#${order.id}</strong>.</p>
                  
                  <h3 style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-top: 30px;">Detalles del Pedido</h3>
                  <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                      <tr style="background-color: #f8f9fa;">
                        <th style="padding: 12px; text-align: left; width: 60px;"></th>
                        <th style="padding: 12px; text-align: left;">Producto</th>
                        <th style="padding: 12px; text-align: left;">Detalles</th>
                        <th style="padding: 12px; text-align: center;">Cant.</th>
                        <th style="padding: 12px; text-align: right;">Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="4" style="padding: 12px; text-align: right; font-weight: bold;">Total:</td>
                        <td style="padding: 12px; text-align: right; font-weight: bold;">$${order.total_payment.toLocaleString('es-CO')}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <div style="background-color: #f8f9fa; padding: 15px; margin-top: 30px; border-radius: 5px;">
                    <h4 style="margin-top: 0;">Dirección de Envío:</h4>
                    <p style="margin-bottom: 0;">
                      ${order.shipping_address}<br>
                      Tel: ${order.customer.current_phone_number}
                    </p>
                  </div>

                  <p style="margin-top: 30px; text-align: center;">
                    <a href="${this.configService.get<string>('FRONTEND_URL')}/tracking" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Rastrear mi Pedido</a>
                  </p>
                </div>

                <div style="text-align: center; padding: 20px; background-color: #f8f9fa; font-size: 12px; color: #999;">
                  <p>&copy; ${new Date().getFullYear()} Two Six. Todos los derechos reservados.</p>
                </div>
              </div>
            `,
            });
          } catch (error) {
            console.error('Error enviando correo:', error);
          }
        }

        return {
          status: 'APPROVED',
          orderId: order.id,
          transactionId: transactionId,
          message: 'Pago aprobado exitosamente'
        };
      } else {
        // Si fue rechazada o error
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'Rechazado', // O el estado que prefieras
          }
        });

        return {
          status: transaction.status,
          orderId: order.id,
          message: `El pago no fue aprobado. Estado: ${transaction.status}`
        };
      }

    } catch (error) {
      console.error('Error verificando pago Wompi:', error);
      throw error;
    }
  }

  async checkStatusByReference(reference: string) {
    try {
      const wompiApiUrl = this.configService.get<string>('WOMPI_API_URL');
      const privateKey = this.configService.get<string>('WOMPI_PRIVATE_KEY');

      if (!privateKey) {
        throw new Error('WOMPI_PRIVATE_KEY no está configurado en el .env');
      }

      // Consultar transacciones por referencia
      const response = await fetch(`${wompiApiUrl}/transactions?reference=${reference}`, {
        headers: {
          'Authorization': `Bearer ${privateKey}` // Wompi requiere llave PRIVADA para consultar
        }
      });

      if (!response.ok) {
        throw new Error(`Error consultando Wompi: ${response.statusText}`);
      }

      const data = await response.json();
      const transactions = data.data;

      if (!transactions || transactions.length === 0) {
        return { status: 'PENDING', message: 'No se encontró transacción aún' };
      }

      // Tomar la última transacción (la más reciente)
      const latestTransaction = transactions[0];
      const status = latestTransaction.status;

      // Si la transacción está aprobada, obtenemos el ID de la orden
      if (status === 'APPROVED') {
        const result = await this.verifyPayment(latestTransaction.id);
        return result;
      }

      return {
        status: status,
        transactionId: latestTransaction.id,
        reference: reference,
        message: latestTransaction.status_message
      };

    } catch (error) {
      console.error('Error consultando estado por referencia:', error);
      return { status: 'ERROR', message: error.message };
    }
  }

  create(createOrderDto: CreateOrderDto) {
    return this.prisma.order.create({
      data: createOrderDto,
    });
  }

  async trackOrder(dto: { orderId: number; email: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        shipments: {
          include: {
            shippingProvider: true,
            trackingHistory: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Orden no encontrada');
    }

    if (order.customer.email.toLowerCase() !== dto.email.toLowerCase()) {
      throw new Error('El correo electrónico no coincide con la orden');
    }

    return order;
  }

  findAll() {
    return this.prisma.order.findMany({
      include: {
        customer: true,
        payments: {
          include: {
            paymentMethod: true
          }
        }
      },
      orderBy: {
        order_date: 'desc',
      },
    });
  }

  findOne(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        shipments: {
          include: {
            shippingProvider: true,
            trackingHistory: true,
          },
        },
        payments: {
          include: {
            paymentMethod: true
          }
        }
      },
    });
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
    });
  }

  remove(id: number) {
    return this.prisma.order.delete({ where: { id } });
  }

  async findByCustomerEmail(email: string) {
    return this.prisma.order.findMany({
      where: {
        customer: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        shipments: {
          include: {
            shippingProvider: true,
            trackingHistory: true,
          },
        },
        payments: true,
      },
      orderBy: {
        order_date: 'desc',
      },
    });
  }
}