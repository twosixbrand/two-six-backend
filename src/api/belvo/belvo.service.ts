import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderService } from '../order/order.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BelvoService {
  private readonly logger = new Logger(BelvoService.name);

  constructor(
    private configService: ConfigService,
    private orderService: OrderService,
    private prisma: PrismaService,
  ) {}

  // ─────────────────────────────────────────────────────────
  // FASE 1: Connect Widget — Generación de Access Token
  // Belvo requiere un token temporal generado server-side para
  // inicializar el widget en el frontend de forma segura.
  // ─────────────────────────────────────────────────────────
  async createWidgetAccessToken(): Promise<string> {
    const secretId = this.configService.get<string>('BELVO_SECRET_ID');
    const secretPassword = this.configService.get<string>('BELVO_SECRET_PASSWORD');
    const baseUrl = this.configService.get<string>('BELVO_API_BASE_URL', 'https://sandbox.belvo.com');

    if (!secretId || !secretPassword) {
      throw new Error('BELVO_SECRET_ID o BELVO_SECRET_PASSWORD no están configurados');
    }

    // Basic Auth: base64(secretId:secretPassword)
    const credentials = Buffer.from(`${secretId}:${secretPassword}`).toString('base64');

    this.logger.log(`[Belvo] Solicitando widget access token a ${baseUrl}`);

    const response = await fetch(`${baseUrl}/api/token/`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: secretId,
        password: secretPassword,
        scopes: 'read_institutions,read_links,write_links',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`[Belvo] Error obteniendo token: ${response.status} — ${errorText}`);
      throw new Error(`Error al obtener token de Belvo: ${response.statusText}`);
    }

    const data = await response.json();
    this.logger.log('[Belvo] Widget access token generado correctamente');
    return data.access;
  }

  // ─────────────────────────────────────────────────────────
  // Procesamiento de Webhooks de Belvo
  // Maneja tanto eventos de Links (Fase 1) como eventos de
  // Payments (Fase 2, cuando Belvo habilite Colombia).
  // ─────────────────────────────────────────────────────────
  async processWebhook(payload: any) {
    this.logger.log(`[Belvo] Webhook recibido — tipo: ${payload.webhook_type || payload.event || 'desconocido'}`);

    // ── Eventos de Link (Connect Widget — FASE 1) ──────────
    if (payload.webhook_type === 'LINK') {
      return this.handleLinkEvent(payload);
    }

    // ── Eventos de Pago (A2A Payments — FASE 2) ───────────
    const isPaymentSuccess =
      payload.event === 'payment_intent.succeeded' ||
      payload.status === 'SUCCEEDED';

    if (isPaymentSuccess) {
      return this.handlePaymentSuccess(payload);
    }

    this.logger.log(`[Belvo] Evento ignorado: ${payload.webhook_type || payload.event}`);
    return { status: 'ignored' };
  }

  // ─────────────────────────────────────────────────────────
  // FASE 1: Manejo de eventos de Link
  // ─────────────────────────────────────────────────────────
  private async handleLinkEvent(payload: any) {
    const code = payload.webhook_code; // LINK_CREATED, LINK_UPDATED, LINK_NEEDS_UPDATE

    this.logger.log(`[Belvo] Evento de Link: ${code} — link_id: ${payload.link_id}`);

    switch (code) {
      case 'LINK_CREATED':
        this.logger.log(`[Belvo] Nueva conexión bancaria creada: ${payload.link_id}`);
        // TODO Fase 2: Asociar link_id con la orden del cliente
        // cuando Belvo Payments esté disponible en Colombia.
        return { status: 'link_created', link_id: payload.link_id };

      case 'LINK_NEEDS_UPDATE':
        this.logger.warn(`[Belvo] El link ${payload.link_id} necesita re-autenticación`);
        return { status: 'link_needs_update' };

      default:
        this.logger.log(`[Belvo] Evento de link no manejado: ${code}`);
        return { status: 'ignored' };
    }
  }

  // ─────────────────────────────────────────────────────────
  // FASE 2: Manejo de pagos exitosos (A2A)
  // Se activará cuando Belvo habilite Payments para Colombia
  // ─────────────────────────────────────────────────────────
  private async handlePaymentSuccess(payload: any) {
    const reference = payload.data?.reference || payload.reference;

    if (!reference) {
      this.logger.error('[Belvo] No se encontró referencia en el webhook de pago');
      return { status: 'missing_reference' };
    }

    const order = await this.prisma.order.findUnique({
      where: { order_reference: reference },
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
      this.logger.error(`[Belvo] Orden con referencia ${reference} no encontrada`);
      return { status: 'order_not_found' };
    }

    if (order.is_paid) {
      this.logger.log(`[Belvo] Orden ${reference} ya procesada. Ignorando duplicado.`);
      return { status: 'already_paid' };
    }

    // 1. Marcar orden como pagada
    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'Pagado', is_paid: true },
    });

    // 2. Registrar método de pago Belvo si no existe
    let paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { name: 'Belvo' },
    });
    if (!paymentMethod) {
      paymentMethod = await this.prisma.paymentMethod.create({
        data: { name: 'Belvo', enabled: true },
      });
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
        amount: order.total_payment,
      },
    });

    // 4. Facturación DIAN, correo y asientos contables
    await this.orderService.processSuccessfulPayment(order);

    this.logger.log(`[Belvo] Pago procesado exitosamente para orden ${reference}`);
    return { status: 'processed' };
  }
}
