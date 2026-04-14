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
  ConsignmentDispatchService,
  CreateDispatchDto,
  ConfirmReceptionDto,
} from './consignment-dispatch.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('consignment/dispatches')
export class ConsignmentDispatchController {
  constructor(private readonly service: ConsignmentDispatchService) {}

  // ================= Endpoints privados (CMS) =================

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateDispatchDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('id_warehouse') id_warehouse?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll({
      id_warehouse: id_warehouse ? Number(id_warehouse) : undefined,
      status,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/send')
  send(@Param('id', ParseIntPipe) id: number) {
    return this.service.send(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.service.cancel(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  // ================= Endpoints públicos (QR) =================

  @Public()
  @Get('by-token/:token')
  getByToken(@Param('token') token: string) {
    return this.service.findByToken(token);
  }

  @Public()
  @Post('by-token/:token/confirm')
  confirm(@Param('token') token: string, @Body() dto: ConfirmReceptionDto) {
    return this.service.confirmByToken(token, dto);
  }
}
