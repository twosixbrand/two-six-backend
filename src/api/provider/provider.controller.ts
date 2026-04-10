import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete, UseGuards } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';


@UseGuards(JwtAuthGuard)
@Controller('provider')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Post()
  create(@Body() createProviderDto: CreateProviderDto) {
    return this.providerService.create(createProviderDto);
  }

  @Get()
  findAll() {
    return this.providerService.findAll();
  }

  @Get(':nit')
  findOne(@Param('nit') nit: string) {
    return this.providerService.findOne(nit);
  }

  @Patch(':nit')
  update(
    @Param('nit') nit: string,
    @Body() updateProviderDto: UpdateProviderDto,
  ) {
    return this.providerService.update(nit, updateProviderDto);
  }

  @Delete(':nit')
  remove(@Param('nit') nit: string) {
    return this.providerService.remove(nit);
  }
}