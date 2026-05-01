import { Controller, Post, Body, HttpCode, Req } from '@nestjs/common';
import { BelvoService } from './belvo.service';

@Controller('belvo')
export class BelvoController {
  constructor(private readonly belvoService: BelvoService) {}

  @Post('webhook')
  @HttpCode(200) // Siempre retornar 200 a los webhooks para que no reintenten infinitamente
  async handleWebhook(@Body() payload: any) {
    return this.belvoService.processWebhook(payload);
  }
}
