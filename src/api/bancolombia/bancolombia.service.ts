import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderService } from '../order/order.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * BancolombiaService
 *
 * Gestiona la integración con el Botón Bancolombia (API directa).
 *
 * ARQUITECTURA DEL FLUJO:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  1. Frontend solicita sesión de pago                           │
 * │  2. Backend crea Payment Session en la API de Bancolombia       │
 * │  3. Bancolombia retorna redirect_url al portal del banco        │
 * │  4. Usuario se autentica y aprueba el débito en Bancolombia     │
 * │  5. Bancolombia redirige al callback_url con resultado          │
 * │  6. Bancolombia envía webhook de confirmación al backend        │
 * │  7. Backend procesa la orden: DIAN + correo + contabilidad      │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * ESTADO: Pendiente de credenciales API de Bancolombia.
 * Reunión en gestión con ejecutiva transaccional — Sucursal Sabaneta.
 *
 * REFERENCIAS:
 * - Asesor Pyme: Melisa Restrepo Quintero (mrestretr@bancolombia.com.co)
 * - NIT Two Six S.A.S.: 902000697-5
 */
@Injectable()
export class BancolombiaService {
  private readonly logger = new Logger(BancolombiaService.name);

  // URLs base según ambiente — se actualizan con credenciales reales
  private readonly apiBaseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly callbackUrl: string;

  constructor(
    private configService: ConfigService,
    private orderService: OrderService,
    private prisma: PrismaService,
  ) {
    this.apiBaseUrl = this.configService.get<string>(
      'BANCOLOMBIA_API_BASE_URL',
      'https://sandbox.bancolombia.com.co', // Placeholder — actualizar con URL real de sandbox
    );
    this.clientId = this.configService.get<string>('BANCOLOMBIA_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('BANCOLOMBIA_CLIENT_SECRET', '');
    this.callbackUrl = this.configService.get<string>(
      'BANCOLOMBIA_CALLBACK_URL',
      `${this.configService.get('FRONTEND_URL')}/checkout/bancolombia-return`,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // PASO 1: Crear sesión de pago (Payment Session)
  //
  // TODO: Implementar cuando Bancolombia provea las credenciales API.
  //
  // Parámetros esperados (basados en el estándar del Botón Bancolombia):
  //   - amount:      Monto en COP (entero, sin decimales)
  //   - reference:   Referencia única de la orden (ej: "TS-260509-001")
  //   - description: Descripción del pago (ej: "Compra Two Six")
  //   - currency:    "COP"
  //
  // Respuesta esperada:
  //   - redirectUrl: URL del portal de Bancolombia donde el cliente autentica
  //   - sessionId:   ID de la sesión para rastreo
  // ─────────────────────────────────────────────────────────────────
  async createPaymentSession(params: {
    amount: number;
    reference: string;
    description: string;
  }): Promise<{ redirectUrl: string; sessionId: string }> {
    this.logger.log(
      `[Bancolombia] Creando sesión de pago — Referencia: ${params.reference} | Monto: $${params.amount} COP`,
    );

    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        'Credenciales de Bancolombia no configuradas. ' +
          'Agrega BANCOLOMBIA_CLIENT_ID y BANCOLOMBIA_CLIENT_SECRET al .env',
      );
    }

    // ── TODO: Implementar llamada real a la API del Botón Bancolombia ──
    // Patrón esperado (REST con OAuth2 o API Key según documentación de Bancolombia):
    //
    // const token = await this.getAccessToken();
    // const response = await fetch(`${this.apiBaseUrl}/payments/v1/sessions`, {
    //   method: 'POST',
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     amount: { value: params.amount, currency: 'COP' },
    //     reference: params.reference,
    //     description: params.description,
    //     redirectUrls: {
    //       success: `${this.callbackUrl}?status=success&reference=${params.reference}`,
    //       failure: `${this.callbackUrl}?status=failure&reference=${params.reference}`,
    //       pending: `${this.callbackUrl}?status=pending&reference=${params.reference}`,
    //     },
    //   }),
    // });
    // const data = await response.json();
    // return { redirectUrl: data.redirectUrl, sessionId: data.id };

    throw new Error(
      '[Bancolombia] createPaymentSession no implementado — pendiente de credenciales API. ' +
        'Consultar con ejecutiva transaccional de Bancolombia Sabaneta.',
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // PASO 2 (Opcional): Obtener Access Token OAuth2
  //
  // TODO: Implementar si Bancolombia usa OAuth2 (client_credentials flow).
  //       Algunos bancos prefieren API Key estática en headers.
  // ─────────────────────────────────────────────────────────────────
  private async getAccessToken(): Promise<string> {
    // TODO: Implementar
    // const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    // const response = await fetch(`${this.apiBaseUrl}/auth/oauth2/token`, {
    //   method: 'POST',
    //   headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    //   body: 'grant_type=client_credentials&scope=payments',
    // });
    // const data = await response.json();
    // return data.access_token;
    throw new Error('[Bancolombia] getAccessToken no implementado');
  }

  // ─────────────────────────────────────────────────────────────────
  // PASO 3: Verificar firma del webhook (seguridad)
  //
  // TODO: Implementar según documentación de Bancolombia.
  //       Bancolombia firma sus webhooks con HMAC-SHA256 (pendiente confirmar).
  // ─────────────────────────────────────────────────────────────────
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const webhookSecret = this.configService.get<string>('BANCOLOMBIA_WEBHOOK_SECRET', '');

    if (!webhookSecret) {
      this.logger.warn('[Bancolombia] BANCOLOMBIA_WEBHOOK_SECRET no configurado — verificación omitida');
      return true; // En sandbox, se puede omitir temporalmente
    }

    // TODO: Implementar verificación HMAC cuando Bancolombia provea la especificación
    // import * as crypto from 'crypto';
    // const expected = crypto
    //   .createHmac('sha256', webhookSecret)
    //   .update(payload)
    //   .digest('hex');
    // return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

    this.logger.warn('[Bancolombia] Verificación de firma pendiente de implementación');
    return true;
  }

  // ─────────────────────────────────────────────────────────────────
  // PASO 4: Procesar Webhook de confirmación de pago
  //
  // Maneja el evento de pago exitoso que Bancolombia envía al backend.
  // Reutiliza orderService.processSuccessfulPayment() para DIAN/contabilidad.
  // ─────────────────────────────────────────────────────────────────
  async processWebhook(payload: any, rawBody?: string, signature?: string) {
    this.logger.log('[Bancolombia] Webhook recibido');

    // Verificar autenticidad del webhook
    if (rawBody && signature) {
      const isValid = this.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        this.logger.error('[Bancolombia] Firma del webhook inválida — rechazando');
        return { status: 'invalid_signature' };
      }
    }

    // TODO: Adaptar según la estructura real del payload de Bancolombia.
    //       Los campos exactos se confirman en la reunión con el equipo técnico.
    const status = payload.status || payload.transactionStatus;
    const reference = payload.reference || payload.commerceReference;

    this.logger.log(`[Bancolombia] Estado del pago: ${status} | Referencia: ${reference}`);

    if (status !== 'APPROVED' && status !== 'PAGADO') {
      this.logger.log(`[Bancolombia] Pago no aprobado (${status}) — ignorando`);
      return { status: 'not_approved', receivedStatus: status };
    }

    if (!reference) {
      this.logger.error('[Bancolombia] Referencia de orden no encontrada en el webhook');
      return { status: 'missing_reference' };
    }

    return this.fulfillOrder(reference, payload);
  }

  // ─────────────────────────────────────────────────────────────────
  // Lógica de fulfillment — Compartida con Wompi y Belvo (Fase 2)
  // ─────────────────────────────────────────────────────────────────
  private async fulfillOrder(reference: string, payload: any) {
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
      this.logger.error(`[Bancolombia] Orden con referencia ${reference} no encontrada`);
      return { status: 'order_not_found' };
    }

    if (order.is_paid) {
      this.logger.log(`[Bancolombia] Orden ${reference} ya estaba pagada — evitando duplicado`);
      return { status: 'already_paid' };
    }

    // 1. Marcar como pagada
    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'Pagado', is_paid: true },
    });

    // 2. Registrar método de pago Bancolombia
    let paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { name: 'Botón Bancolombia' },
    });
    if (!paymentMethod) {
      paymentMethod = await this.prisma.paymentMethod.create({
        data: { name: 'Botón Bancolombia', enabled: true },
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
        transaction_reference: payload.transactionId || payload.id || 'bancolombia-tx',
        amount: order.total_payment,
      },
    });

    // 4. Facturación DIAN + correo + asientos contables
    await this.orderService.processSuccessfulPayment(order);

    this.logger.log(`[Bancolombia] Orden ${reference} procesada exitosamente`);
    return { status: 'fulfilled' };
  }
}
