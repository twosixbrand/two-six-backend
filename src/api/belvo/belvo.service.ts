import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderService } from '../order/order.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BelvoService {
  constructor(
    private configService: ConfigService,
    private orderService: OrderService,
    private prisma: PrismaService,
  ) {}

  async processWebhook(payload: any) {
    console.log('[BELVO] Webhook received', payload);
    
    // Webhook event payload for Payment Intent
    // Event format depends on Belvo doc, e.g. 'payment_intent.succeeded'
    const isSuccess = payload.event === 'payment_intent.succeeded' || payload.status === 'SUCCEEDED';
    if (!isSuccess) {
       console.log('[BELVO] Ignorando evento no exitoso:', payload.event || payload.status);
       return { status: 'ignored' };
    }

    const reference = payload.data?.reference || payload.reference;
    if (!reference) {
      console.error('[BELVO] No se encontró referencia en el webhook');
      return { status: 'missing_reference' };
    }

    const order = await this.prisma.order.findUnique({
      where: { order_reference: reference },
      include: {
        customer: { include: { identificationType: true } },
        orderItems: { include: { product: { include: { clothingSize: { include: { clothingColor: { include: { imageClothing: true } } } } } } } },
      }
    });

    if (!order) {
      console.error(`[BELVO] Orden con referencia ${reference} no encontrada`);
      return { status: 'order_not_found' };
    }

    if (order.is_paid) {
      console.log(`[BELVO] La orden ${reference} ya está pagada`);
      return { status: 'already_paid' };
    }

    // 1. Actualizar la orden a Pagada
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'Pagado',
        is_paid: true
      }
    });

    // 2. Registrar en base de datos el método de pago si no existe
    let paymentMethod = await this.prisma.paymentMethod.findFirst({ where: { name: 'Belvo' } });
    if (!paymentMethod) {
      paymentMethod = await this.prisma.paymentMethod.create({ data: { name: 'Belvo', enabled: true } });
    }

    // 3. Registrar transacción
    await this.prisma.payments.create({
      data: {
        id_order: order.id,
        id_customer: order.id_customer,
        id_payment_method: paymentMethod.id,
        status: 'APPROVED',
        transaction_date: new Date(),
        transaction_reference: payload.data?.id || payload.id || 'belvo-tx',
        amount: order.total_payment
      }
    });

    // 4. Llamar a la lógica común de Facturación DIAN, Email y Contabilidad
    await this.orderService.processSuccessfulPayment(order);

    return { status: 'processed' };
  }
}
