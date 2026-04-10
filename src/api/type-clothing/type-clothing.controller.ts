import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete, UseGuards } from '@nestjs/common';
import { TypeClothingService } from './type-clothing.service';
import { CreateTypeClothingDto } from './dto/create-type-clothing.dto';
import { UpdateTypeClothingDto } from './dto/update-type-clothing.dto';

@Controller('type-clothing')
export class TypeClothingController {
  constructor(private readonly typeClothingService: TypeClothingService) {}
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createTypeClothingDto: CreateTypeClothingDto) {
    return this.typeClothingService.create(createTypeClothingDto);
  }

  @Get()
  findAll() {
    return this.typeClothingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.typeClothingService.findOne(id);
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTypeClothingDto: UpdateTypeClothingDto,
  ) {
    return this.typeClothingService.update(id, updateTypeClothingDto);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.typeClothingService.remove(id);
  }
}
