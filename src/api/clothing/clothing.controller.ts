import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe, UseGuards } from '@nestjs/common';
import { ClothingService } from './clothing.service';
import { CreateClothingDto } from './dto/create-clothing.dto';
import { UpdateClothingDto } from './dto/update-clothing.dto';

@Controller('clothing')
export class ClothingController {
  constructor(private readonly clothingService: ClothingService) {}
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createClothingDto: CreateClothingDto) {
    return this.clothingService.create(createClothingDto);
  }

  @Get()
  findAll() {
    return this.clothingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clothingService.findOne(id);
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClothingDto: UpdateClothingDto,
  ) {
    return this.clothingService.update(id, updateClothingDto);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clothingService.remove(id);
  }
}
