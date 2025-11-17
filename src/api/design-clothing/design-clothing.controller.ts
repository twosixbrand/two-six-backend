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
import { DesignClothingService } from './design-clothing.service';
import { CreateDesignClothingDto } from './dto/create-design-clothing.dto';
import { UpdateDesignClothingDto } from './dto/update-design-clothing.dto';
import { ApiOkResponse } from '@nestjs/swagger';
import { DesignClothingEntity } from './entities/design-clothing.entity';

@Controller('design-clothing')
export class DesignClothingController {
  constructor(private readonly designClothingService: DesignClothingService) {}

  @Post()
  create(@Body() createDesignClothingDto: CreateDesignClothingDto) {
    return this.designClothingService.create(createDesignClothingDto);
  }

  @Get()
  findAll() {
    return this.designClothingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.designClothingService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: DesignClothingEntity })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDesignClothingDto: UpdateDesignClothingDto,
  ) {
    return this.designClothingService.update(id, updateDesignClothingDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.designClothingService.remove(id);
  }
}