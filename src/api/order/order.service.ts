import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  async validateDiscountCode(code: string, email: string) {
    if (!code) throw new BadRequestException('Debes proporcionar un código');

    const subscriber = await this.prisma.subscriber.findUnique({
      where: { discount_code: code.trim().toUpperCase() }
    });

    if (!subscriber) {
      throw new BadRequestException('El código de descuento no es válido');
    }

    if (subscriber.email.toLowerCase() !== email.toLowerCase()) {
      throw new BadRequestException('Este código pertenece a otra cuenta de correo');
    }

    if (!subscriber.status || subscriber.unsubscribed) {
      throw new BadRequestException('La suscripción no está activa');
    }

    if (subscriber.is_discount_used) {
      throw new BadRequestException('Este código ya fue utilizado en un pedido anterior');
    }

    return { valid: true, percentage: 10, code: subscriber.discount_code };
  }

  async checkout(checkoutDto: CheckoutDto) {
    const { customer, items, total, shippingCost, paymentMethod } = checkoutDto;
    
    // Validate Payment Method
    const method = paymentMethod === 'WOMPI_COD' ? 'WOMPI_COD' : 'WOMPI_FULL';
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    // If COD, the amount to collect is the subtotal (products), otherwise 0
    const codAmount = method === 'WOMPI_COD' ? subtotal : 0;


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

      // Validate Discount if provided
      if (checkoutDto.discountCode) {
        const subscriber = await prisma.subscriber.findUnique({
          where: { discount_code: checkoutDto.discountCode.trim().toUpperCase() }
        });

        if (!subscriber || subscriber.is_discount_used || subscriber.email.toLowerCase() !== customer.email.toLowerCase()) {
          throw new BadRequestException('El código de descuento no es válido o ya fue usado');
        }
      }

      // 3. Create Order Reference
      let referencedGenerated = false;
      let attempts = 0;
      let newReference = '';

      while (!referencedGenerated && attempts < 10) {
        const d = new Date();
        const yy = String(d.getFullYear()).slice(-2);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const randomStr = String(Math.floor(1000 + Math.random() * 9000));

        newReference = `TS-${yy}${mm}${dd}-${randomStr}`;

        const exists = await prisma.order.findUnique({
          where: { order_reference: newReference }
        });

        if (!exists) {
          referencedGenerated = true;
        }
        attempts++;
      }

      if (!referencedGenerated) {
        throw new BadRequestException('No se pudo generar una referencia única para el pedido. Por favor, inténtalo de nuevo.');
      }

      // 4. Create Order
      const order = await prisma.order.create({
        data: {
          id_customer: customerRecord.id,
          order_date: new Date(),
          status: 'Pendiente',
          iva: iva,
          shipping_cost: shippingCost,
          total_payment: total,
          payment_method: method,
          cod_amount: codAmount,
          purchase_date: new Date(),
          order_reference: newReference,
          is_paid: false, // Payment integration would update this
          shipping_address: `${customer.address}, ${customer.city}, ${customer.department}`,
        },
        include: {
          customer: true
        }
      });

      // 5. Create Order Items and Update Stock
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
        // First get the product to find the clothingSize ID
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { clothingSize: true },
        });

        if (product && product.clothingSize) {
          // Update ClothingSize quantities directly
          await prisma.clothingSize.update({
            where: { id: product.clothingSize.id },
            data: {
              quantity_available: { decrement: item.quantity },
              quantity_sold: { increment: item.quantity }
            }
          });
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

    // Determine Wompi checkout amount depending on COD or Full payment
    const totalToPayNow = method === 'WOMPI_COD' ? shippingCost : total;
    const amountInCents = Math.round(totalToPayNow * 100);
    
    // Usar el order_reference para Wompi
    const reference = order.order_reference;
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
      const orderReference = transaction.reference;

      if (!orderReference) {
        throw new Error(`Referencia de orden inválida en la transacción de Wompi: ${transaction.reference}`);
      }

      // 3. Buscar la orden por Referencia
      const order = await this.prisma.order.findUnique({
        where: { order_reference: orderReference },
        include: {
          customer: true,
          orderItems: {
            include: {
              product: {
                include: {
                  clothingSize: {
                    include: {
                      clothingColor: {
                        include: {
                          imageClothing: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!order) {
        throw new Error(`Orden con referencia ${orderReference} no encontrada`);
      }
      console.log('Order found:', order.order_reference);

      // 4. Verificar el estado
      // Estados de Wompi: APPROVED, DECLINED, VOIDED, ERROR
      if (transaction.status === 'APPROVED') {
        // Verificar el monto (opcional pero recomendado)
        const amountInCents = transaction.amount_in_cents;
        const expectedPaymentAmount = order.payment_method === 'WOMPI_COD' ? order.shipping_cost : order.total_payment;
        const orderTotalInCents = expectedPaymentAmount * 100;

        if (amountInCents < orderTotalInCents) {
          console.warn(`Alerta: El monto pagado (${amountInCents}) es menor al total esperado de la orden (${orderTotalInCents})`);
        }

        // 3. Actualizar estado de la orden
        const nextStatus = order.payment_method === 'WOMPI_COD' ? 'Aprobado PCE' : 'Pagado';

        await this.prisma.order.update({
          where: { order_reference: orderReference },
          data: {
            status: nextStatus,
            is_paid: order.payment_method === 'WOMPI_COD' ? false : true,
          },
        });

        // Mark discount as used if applicable
        const orderSubtotal = order.orderItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
        const expectedTotalWithoutDiscount = orderSubtotal + order.shipping_cost;
        const hasDiscount = order.total_payment < expectedTotalWithoutDiscount;

        if (hasDiscount) {
          const subscriber = await this.prisma.subscriber.findUnique({
            where: { email: order.customer.email }
          });

          if (subscriber && !subscriber.is_discount_used) {
            await this.prisma.subscriber.update({
              where: { email: order.customer.email },
              data: { is_discount_used: true }
            });
          }
        }

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
                id_order: order.id,
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
                <img src="${item.product.clothingSize?.clothingColor?.imageClothing?.[0]?.image_url || 'https://example.com/placeholder.png'}" alt="${item.product_name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">
                <div style="font-weight: bold;">${item.product_name}</div>
                <div style="font-size: 12px; color: #666;">Ref: ${item.id_product}</div>
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.size} / ${item.color}</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${(item.unit_price * item.quantity).toLocaleString('es-CO')}</td>
            </tr>
          `).join('');

            const subtotal = order.orderItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
            const shipping = order.shipping_cost || 0;
            // Sometimes JS floating point issues can make a tiny discount, so we check if it's > 1
            const discount = Math.round((subtotal + shipping) - order.total_payment);

            let discountHtml = '';
            if (discount > 1) {
              discountHtml = `
                <tr>
                  <td colspan="4" style="padding: 4px 12px; text-align: right; color: #dc3545;">Descuento aplicado:</td>
                  <td style="padding: 4px 12px; text-align: right; color: #dc3545;">-$${discount.toLocaleString('es-CO')}</td>
                </tr>
              `;
            }

            const isCod = order.payment_method === 'WOMPI_COD';
            const paidToday = isCod ? shipping : order.total_payment;
            const dueOnDelivery = isCod ? subtotal : 0;

            const tfootHtml = `
              <tr>
                <td colspan="4" style="padding: 12px 12px 4px 12px; text-align: right;">Subtotal:</td>
                <td style="padding: 12px 12px 4px 12px; text-align: right;">$${subtotal.toLocaleString('es-CO')}</td>
              </tr>
               ${discountHtml}
              <tr>
                <td colspan="4" style="padding: 4px 12px; text-align: right;">Costo de envío:</td>
                <td style="padding: 4px 12px; text-align: right;">$${shipping.toLocaleString('es-CO')}</td>
              </tr>
              <tr>
                <td colspan="4" style="padding: 12px; text-align: right; font-weight: bold; border-top: 1px solid #eee;">Total Pagado Hoy:</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; border-top: 1px solid #eee; color: #10b981;">$${paidToday.toLocaleString('es-CO')}</td>
              </tr>
              ${dueOnDelivery > 0 ? `
              <tr>
                <td colspan="4" style="padding: 12px; text-align: right; font-weight: bold; border-top: 1px solid #eee;">A Pagar Contra Entrega (PCE):</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; border-top: 1px solid #eee; color: #d4af37;">$${dueOnDelivery.toLocaleString('es-CO')}</td>
              </tr>` : ''}
            `;

            const storeEmail = this.configService.get<string>('EMAIL_TO');
            console.log(`Enviando correo de confirmación a: ${order.customer.email} (copia a: ${storeEmail || 'NO CONFIGURADO'})`);

            await this.mailerService.sendMail({
              to: order.customer.email,
              ...(storeEmail ? { bcc: storeEmail } : {}),
              subject: `Confirmación de Pedido ${order.order_reference} - Two Six`,
              html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="text-align: center; padding: 20px; background-color: #f8f9fa;">
                  <h1 style="color: #000; margin: 0;">TWO SIX</h1>
                  <p style="color: #666; font-size: 14px; letter-spacing: 2px;">ESTILO Y CONFORT</p>
                </div>
                
                <div style="padding: 20px;">
                  <h2 style="color: #333;">¡Gracias por tu compra, ${order.customer.name}!</h2>
                  <p>Hemos recibido el pago de tu envío para el pedido <strong>${order.order_reference}</strong>. Tu pedido está confirmado.</p>
                  ${isCod ? `<div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
                    <strong>Importante:</strong> Has seleccionado Pago Contra Entrega (PCE). Deberás entregar <strong>$${dueOnDelivery.toLocaleString('es-CO')}</strong> en efectivo al transportador al momento de recibir tus prendas.
                  </div>` : ''}
                  
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
                      ${tfootHtml}
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
          where: { order_reference: orderReference },
          data: {
            status: 'Rechazado', // O el estado que prefieras
          }
        });

        return {
          status: transaction.status,
          orderId: order.order_reference,
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

  async trackOrder(dto: { orderReference: string; email: string }) {
    const order = await this.prisma.order.findUnique({
      where: { order_reference: dto.orderReference },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: {
              include: {
                clothingSize: {
                  include: {
                    clothingColor: {
                      include: {
                        imageClothing: true
                      }
                    }
                  }
                }
              }
            }
          },
        },
        shipments: {
          include: {
            shippingProvider: true,
            trackingHistory: true,
          },
        },
        payments: true, // Added to get the transaction date for 'Pagado' status
      },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.customer.email.toLowerCase() !== dto.email.toLowerCase()) {
      throw new BadRequestException('El correo electrónico no coincide con la orden');
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
            product: {
              include: {
                clothingSize: {
                  include: {
                    clothingColor: {
                      include: {
                        imageClothing: true
                      }
                    }
                  }
                }
              }
            }
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

  findByReference(reference: string) {
    return this.prisma.order.findUnique({
      where: { order_reference: reference },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: {
              include: {
                clothingSize: {
                  include: {
                    clothingColor: {
                      include: {
                        imageClothing: true
                      }
                    }
                  }
                }
              }
            }
          },
        },
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
            product: {
              include: {
                clothingSize: {
                  include: {
                    clothingColor: {
                      include: {
                        imageClothing: true
                      }
                    }
                  }
                }
              }
            }
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