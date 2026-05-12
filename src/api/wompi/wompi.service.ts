import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * WompiService
 *
 * Responsabilidades:
 *  1. generateCheckoutData()       — Genera la firma SHA256 y datos necesarios para el widget de Wompi.
 *  2. verifyAndFulfillTransaction() — Consulta la API de Wompi, valida el estado, registra el pago en DB
 *                                     y delega la facturación/correos a processSuccessfulPayment (via callback).
 *  3. registerPayment()            — Registra el pago en la tabla `payments`.
 *
 * Desacoplado de OrderService: no contiene lógica de negocio de órdenes.
 * OrderService inyecta WompiService y delega toda responsabilidad de Wompi.
 */
@Injectable()
export class WompiService {
  private readonly logger = new Logger(WompiService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. CHECKOUT — Generación de firma y datos para el widget de Wompi
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Genera los datos necesarios para inicializar el widget de Wompi en el frontend.
   * Calcula la firma SHA256 de integridad según el protocolo de Wompi.
   *
   * @param orderReference  Referencia única de la orden (order_reference)
   * @param paymentMethod   'WOMPI_COD' | 'WOMPI_FULL' | 'WOMPI_CC'
   * @param totalPayment    Monto total en pesos COP
   * @param shippingCost    Costo de envío en pesos COP
   */
  generateCheckoutData(
    orderReference: string,
    paymentMethod: string,
    totalPayment: number,
    shippingCost: number,
  ): {
    publicKey: string;
    currency: string;
    amountInCents: number;
    reference: string;
    integritySignature: string;
  } {
    const integritySecret = this.configService.get<string>('WOMPI_INTEGRITY_SECRET');
    const publicKey = this.configService.get<string>('WOMPI_PUBLIC_KEY');

    if (!integritySecret) {
      throw new Error('WOMPI_INTEGRITY_SECRET no está configurado');
    }
    if (!publicKey) {
      throw new Error('WOMPI_PUBLIC_KEY no está configurado');
    }

    if (
      !integritySecret.startsWith('test_integrity_') &&
      !integritySecret.startsWith('prod_integrity_')
    ) {
      this.logger.warn(
        'WOMPI_INTEGRITY_SECRET no tiene el formato esperado (test_integrity_ | prod_integrity_)',
      );
    }

    // Monto a cobrar: en COD se cobra solo el envío; en FULL o CC se cobra el total
    const totalToPayNow = paymentMethod === 'WOMPI_COD' ? shippingCost : totalPayment;
    const amountInCents = Math.round(totalToPayNow * 100);
    const currency = 'COP';

    // Firma SHA256: reference + amountInCents + currency + integritySecret
    const integrityString = `${orderReference}${amountInCents}${currency}${integritySecret}`;
    const signature = crypto.createHash('sha256').update(integrityString).digest('hex');

    this.logger.log(
      `[Wompi] Checkout data generado — Referencia: ${orderReference} | Monto: ${amountInCents} centavos`,
    );

    return {
      publicKey,
      currency,
      amountInCents,
      reference: orderReference,
      integritySignature: signature,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. VERIFICACIÓN — Consulta la API de Wompi y actualiza el estado de la orden
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Verifica una transacción de Wompi y ejecuta el fulfillment de la orden.
   * El callback `onApproved` recibe la orden encontrada para que OrderService
   * ejecute processSuccessfulPayment() sin crear una dependencia circular.
   *
   * @param transactionId   ID de la transacción de Wompi
   * @param onApproved      Callback llamado cuando el pago es APPROVED (ejecuta DIAN + correos)
   */
  async verifyAndFulfillTransaction(
    transactionId: string,
    onApproved: (order: any) => Promise<any>,
  ): Promise<{
    status: string;
    orderId?: number | string;
    transactionId?: string;
    message?: string;
    invoiceNumber?: string;
    invoice?: any;
  }> {
    this.logger.log(`[Wompi] Verificando transacción: ${transactionId}`);

    if (!transactionId || transactionId === 'undefined' || transactionId === 'null') {
      throw new Error('Transaction ID inválido o no proporcionado');
    }

    // 1. Consultar la API de Wompi
    const wompiApiUrl = this.configService.get<string>('WOMPI_API_URL');
    this.logger.log(`[Wompi] API URL: ${wompiApiUrl}`);

    const response = await fetch(`${wompiApiUrl}/transactions/${transactionId}`);
    if (!response.ok) {
      throw new Error(`Error consultando Wompi: ${response.statusText}`);
    }

    const data = await response.json();
    const transaction = data.data;

    // 2. Validar que la transacción tiene referencia de orden
    const orderReference = transaction.reference;
    if (!orderReference) {
      throw new Error(`Referencia de orden inválida en la transacción de Wompi: ${transaction.reference}`);
    }

    // 3. Buscar la orden en DB
    const order = await this.prisma.order.findUnique({
      where: { order_reference: orderReference },
      include: {
        customer: { include: { identificationType: true } },
        orderItems: {
          include: {
            product: {
              include: {
                clothingSize: {
                  include: {
                    clothingColor: { include: { imageClothing: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error(`Orden con referencia ${orderReference} no encontrada`);
    }
    this.logger.log(`[Wompi] Orden encontrada: ${order.order_reference}`);

    // 4. Prevenir duplicados: si ya fue procesada, retornar la factura existente
    if (order.is_paid && transaction.status === 'APPROVED') {
      this.logger.log(`[Wompi] Orden ${orderReference} ya procesada — evitando duplicado`);
      const existingInvoice = await this.prisma.dianEInvoicing.findFirst({
        where: { id_order: order.id },
        orderBy: { createdAt: 'desc' },
      });
      return {
        status: 'APPROVED',
        orderId: order.id,
        invoiceNumber: existingInvoice?.document_number,
      };
    }

    // 5. Pago APROBADO
    if (transaction.status === 'APPROVED') {
      // 5a. Validar monto (alerta informativa, no bloquea)
      const amountInCents = transaction.amount_in_cents;
      const expectedAmount = order.payment_method === 'WOMPI_COD' ? order.shipping_cost : order.total_payment;
      if (amountInCents < expectedAmount * 100) {
        this.logger.warn(
          `[Wompi] Monto pagado (${amountInCents}) menor al esperado (${expectedAmount * 100})`,
        );
      }

      // 5b. Actualizar estado de la orden
      const nextStatus = order.payment_method === 'WOMPI_COD' ? 'Aprobado PCE' : 'Pagado';
      await this.prisma.order.update({
        where: { order_reference: orderReference },
        data: {
          status: nextStatus,
          is_paid: order.payment_method === 'WOMPI_COD' ? false : true,
        },
      });

      // 5c. Marcar descuento/cupón como usado
      await this.markDiscountAsUsed(order);

      // 5d. Registrar pago en tabla payments
      await this.registerPayment(order, transaction);

      // 5e. Ejecutar facturación DIAN + correos + contabilidad (delegado a OrderService)
      const invoiceData = await onApproved(order);

      return {
        status: 'APPROVED',
        orderId: order.id,
        transactionId,
        message: 'Pago aprobado exitosamente',
        ...(invoiceData ? { invoice: invoiceData } : {}),
      };
    }

    // 6. Pago RECHAZADO / ERROR / VOIDED
    await this.prisma.order.update({
      where: { order_reference: orderReference },
      data: { status: 'Rechazado' },
    });

    return {
      status: transaction.status,
      orderId: order.order_reference ?? undefined,
      message: `El pago no fue aprobado. Estado: ${transaction.status}`,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. REGISTRO DE PAGO — Tabla `payments`
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Registra la transacción aprobada en la tabla `payments`.
   * Idempotente: si ya existe el registro no lo duplica.
   */
  async registerPayment(order: any, transaction: any): Promise<void> {
    const existing = await this.prisma.payments.findFirst({
      where: { transaction_reference: transaction.reference },
    });

    if (existing) {
      this.logger.log(`[Wompi] Pago ${transaction.reference} ya registrado — omitiendo duplicado`);
      return;
    }

    let paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { name: 'Wompi' },
    });
    if (!paymentMethod) {
      paymentMethod = await this.prisma.paymentMethod.create({
        data: { name: 'Wompi', enabled: true },
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
        amount: transaction.amount_in_cents / 100,
      },
    });

    this.logger.log(`[Wompi] Pago registrado — Orden: ${order.order_reference}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────────────────────────────────────────

  private async markDiscountAsUsed(order: any): Promise<void> {
    const orderSubtotal = order.orderItems.reduce(
      (sum: number, item: any) => sum + item.unit_price * item.quantity,
      0,
    );
    const expectedTotalWithoutDiscount = orderSubtotal + order.shipping_cost;
    const hasDiscount = order.total_payment < expectedTotalWithoutDiscount;

    if (order.id_coupon) {
      try {
        await this.prisma.couponUsage.create({
          data: {
            id_coupon: order.id_coupon,
            id_customer: order.id_customer,
            id_order: order.id,
          },
        });
        await this.prisma.coupon.update({
          where: { id: order.id_coupon },
          data: { current_uses: { increment: 1 } },
        });
      } catch {
        // Ya registrado — idempotente
      }
    } else if (hasDiscount) {
      const subscriber = await this.prisma.subscriber.findUnique({
        where: { email: order.customer.email },
      });
      if (subscriber && !subscriber.is_discount_used) {
        await this.prisma.subscriber.update({
          where: { email: order.customer.email },
          data: { is_discount_used: true },
        });
      }
    }
  }
}
