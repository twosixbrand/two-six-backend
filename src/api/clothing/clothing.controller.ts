import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClothingService } from './clothing.service';
import { CreateClothingDto } from './dto/create-clothing.dto';
import { UpdateClothingDto } from './dto/update-clothing.dto';

@Controller('clothing')
export class ClothingController {
  constructor(private readonly clothingService: ClothingService) {}

  @Post()
  create(@Body() createClothingDto: CreateClothingDto) {
    return this.clothingService.create(createClothingDto);
  }

  @Get()
  findAll() {
    return this.clothingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clothingService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClothingDto: UpdateClothingDto) {
    return this.clothingService.update(id, updateClothingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clothingService.remove(id);
  }
}
