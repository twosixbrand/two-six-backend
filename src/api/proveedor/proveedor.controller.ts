import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProveedorService } from './proveedor.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Controller('proveedores')
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Post()
  create(@Body() createProveedorDto: CreateProveedorDto) {
    return this.proveedorService.create(createProveedorDto);
  }

  @Get()
  findAll() {
    return this.proveedorService.findAll();
  }

  @Get(':nit')
  findOne(@Param('nit') nit: string) {
    return this.proveedorService.findOne(nit);
  }

  @Patch(':nit')
  update(@Param('nit') nit: string, @Body() updateProveedorDto: UpdateProveedorDto) {
    return this.proveedorService.update(nit, updateProveedorDto);
  }

  @Delete(':nit')
  remove(@Param('nit') nit: string) {
    return this.proveedorService.remove(nit);
  }
}