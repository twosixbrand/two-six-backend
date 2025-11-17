import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductionTypeService } from './production-type.service';
import { CreateProductionTypeDto } from './dto/create-production-type.dto';
import { UpdateProductionTypeDto } from './dto/update-production-type.dto';

@Controller('production-type')
export class ProductionTypeController {
  constructor(private readonly productionTypeService: ProductionTypeService) {}

  @Post()
  create(@Body() createProductionTypeDto: CreateProductionTypeDto) {
    return this.productionTypeService.create(createProductionTypeDto);
  }

  @Get()
  findAll() {
    return this.productionTypeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productionTypeService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productionTypeService.remove(id);
  }
}