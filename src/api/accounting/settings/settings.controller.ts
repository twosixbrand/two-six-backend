import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AccountingSettingsService } from './settings.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller('accounting/settings')
@UseGuards(JwtAuthGuard)
export class AccountingSettingsController {
  constructor(private readonly service: AccountingSettingsService) {}

  @Get()
  getAll() {
    return this.service.getAll();
  }

  @Get(':key')
  getOne(@Param('key') key: string) {
    return this.service.get(key).then((value) => ({ key, value }));
  }

  @Post()
  setOne(@Body() body: { key: string; value: string; description?: string; updated_by?: number }) {
    return this.service.set(body.key, body.value, body.description, body.updated_by);
  }

  @Post('bulk')
  setMany(@Body() body: { updates: Array<{ key: string; value: string }>; updated_by?: number }) {
    return this.service.setMany(body.updates, body.updated_by);
  }
}
