import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ConsignmentReturnService,
  CreateReturnDto,
} from './consignment-return.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('consignment/returns')
@UseGuards(JwtAuthGuard)
export class ConsignmentReturnController {
  constructor(private readonly service: ConsignmentReturnService) {}

  @Post()
  create(@Body() dto: CreateReturnDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('id_warehouse') id_warehouse?: string,
    @Query('return_type') return_type?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll({
      id_warehouse: id_warehouse ? Number(id_warehouse) : undefined,
      return_type,
      status,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post(':id/process')
  process(@Param('id', ParseIntPipe) id: number) {
    return this.service.process(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.service.cancel(id);
  }

  @Post(':id/attach-credit-note/:creditNoteId')
  attachCreditNote(
    @Param('id', ParseIntPipe) id: number,
    @Param('creditNoteId', ParseIntPipe) creditNoteId: number,
  ) {
    return this.service.attachCreditNote(id, creditNoteId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
