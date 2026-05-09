import { Controller, Post, Get, Body, Headers, HttpCode, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';
import { BancolombiaService } from './bancolombia.service';

/**
 * BancolombiaController
 *
 * Expone los endpoints del Botón Bancolombia:
 *
 *  POST /api/bancolombia/payment-session  → Crea sesión de pago (uso interno)
 *  POST /api/bancolombia/webhook          → Recibe confirmaciones de Bancolombia
 *
 * ESTADO: Esqueleto listo — pendiente de credenciales API de Bancolombia.
 */
@Controller('bancolombia')
export class BancolombiaController {
  constructor(private readonly bancolombiaService: BancolombiaService) {}

  /**
   * Crea una sesión de pago con Botón Bancolombia.
   * Llamado internamente desde OrderService al seleccionar BANCOLOMBIA_BTN.
   *
   * TODO: Habilitar cuando las credenciales API estén disponibles.
   */
  @Post('payment-session')
  @HttpCode(200)
  async createPaymentSession(
    @Body() body: { amount: number; reference: string; description: string },
  ) {
    return this.bancolombiaService.createPaymentSession(body);
  }

  /**
   * Webhook de confirmación de pago.
   * Bancolombia envía un POST aquí cuando el pago es aprobado/rechazado.
   *
   * URL a registrar en el portal de Bancolombia:
   *   - Sandbox:    https://<ngrok-url>/api/bancolombia/webhook
   *   - Producción: https://api.twosixweb.com/api/bancolombia/webhook
   *
   * Siempre retorna HTTP 200 para evitar reintentos infinitos del banco.
   */
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-bancolombia-signature') signature?: string,
    @Req() req?: RawBodyRequest<Request>,
  ) {
    const rawBody = req?.rawBody?.toString('utf8');
    return this.bancolombiaService.processWebhook(payload, rawBody, signature);
  }
}
