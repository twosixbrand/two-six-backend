import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ManualInvoiceService } from './manual-invoice.service';
import { CreateManualInvoiceDto } from './dto/create-manual-invoice.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounting/manual-invoice')
export class ManualInvoiceController {
  constructor(private readonly service: ManualInvoiceService) {}

  @Post()
  create(@Body() dto: CreateManualInvoiceDto) {
    return this.service.createManualInvoice(dto);
  }
}
