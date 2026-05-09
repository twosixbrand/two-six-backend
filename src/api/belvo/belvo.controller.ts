import { Controller, Post, Get, Body, HttpCode } from '@nestjs/common';
import { BelvoService } from './belvo.service';

@Controller('belvo')
export class BelvoController {
  constructor(private readonly belvoService: BelvoService) {}

  /**
   * Genera un Widget Access Token temporal para inicializar el
   * Connect Widget de Belvo en el frontend de forma segura.
   * Las credenciales nunca se exponen al cliente.
   */
  @Get('widget-token')
  async getWidgetToken() {
    const token = await this.belvoService.createWidgetAccessToken();
    return { token };
  }

  /**
   * Receptor de eventos de Belvo (webhooks).
   * Siempre retorna HTTP 200 para evitar reintentos infinitos de Belvo.
   * Maneja eventos de Link (Fase 1) y de Payments (Fase 2).
   */
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() payload: any) {
    return this.belvoService.processWebhook(payload);
  }
}
