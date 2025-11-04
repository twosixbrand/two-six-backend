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
import { TypeClothingService } from './type-clothing.service';
import { CreateTypeClothingDto } from './dto/create-type-clothing.dto';
import { UpdateTypeClothingDto } from './dto/update-type-clothing.dto';

@Controller('type-clothing')
export class TypeClothingController {
  constructor(private readonly typeClothingService: TypeClothingService) {}

  @Post()
  create(@Body() createTypeClothingDto: CreateTypeClothingDto) {
    return this.typeClothingService.create(createTypeClothingDto);
  }

  @Get()
  findAll() {
    return this.typeClothingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.typeClothingService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTypeClothingDto: UpdateTypeClothingDto,
  ) {
    return this.typeClothingService.update(id, updateTypeClothingDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.typeClothingService.remove(id);
  }
}
