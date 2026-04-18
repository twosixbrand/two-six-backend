import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { CashReceiptService } from './cash-receipt.service';
import { CreateCashReceiptDto } from './dto/create-cash-receipt.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounting/cash-receipt')
export class CashReceiptController {
  constructor(private readonly service: CashReceiptService) {}

  @Post()
  create(@Body() dto: CreateCashReceiptDto) {
    return this.service.createCashReceipt(dto);
  }

  @Get('pending')
  listPending(@Query('advance_puc_code') advancePucCode: string) {
    return this.service.listPending(advancePucCode || '280505');
  }

  @Get(':journalEntryId/balance')
  getBalance(
    @Param('journalEntryId', ParseIntPipe) journalEntryId: number,
    @Query('advance_puc_code') advancePucCode: string,
  ) {
    return this.service
      .getAvailableBalance(journalEntryId, advancePucCode)
      .then((balance) => ({ journal_entry_id: journalEntryId, advance_puc_code: advancePucCode, balance }));
  }
}
