import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClothingColorService } from './clothing-color.service';
import { CreateClothingColorDto } from './dto/create-clothing-color.dto';
import { UpdateClothingColorDto } from './dto/update-clothing-color.dto';
import { ApiOkResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ClothingColorEntity } from './entities/clothing-color.entity';
import { Express } from 'express';

@Controller('clothing-color')
export class ClothingColorController {
  constructor(private readonly clothingColorService: ClothingColorService) { }

  @Post()
  create(@Body() createClothingColorDto: CreateClothingColorDto) {
    return this.clothingColorService.create(createClothingColorDto);
  }

  @Post('contextual')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        id_design: { type: 'integer' },
        id_color: { type: 'integer' },
        sizes: { type: 'string', description: 'JSON string of sizes array' },
      },
    },
  })
  async createContextual(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { id_design: string; id_color: string; sizes: string },
  ) {
    try {
      console.log('Controller createContextual received body:', body);

      const id_design = parseInt(body.id_design, 10);
      const id_color = parseInt(body.id_color, 10);
      let sizes;

      try {
        sizes = JSON.parse(body.sizes);
      } catch (e) {
        throw new BadRequestException(`Invalid sizes JSON format: ${e.message}`);
      }

      if (!sizes || !Array.isArray(sizes)) {
        throw new BadRequestException('Sizes must be a valid array');
      }

      return await this.clothingColorService.createContextual(file, id_design, id_color, sizes);
    } catch (error) {
      console.error('Controller Error in createContextual:', error);
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message || 'Unexpected error processing request');
    }
  }

  @Get()
  findAll() {
    return this.clothingColorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clothingColorService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ClothingColorEntity })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClothingColorDto: UpdateClothingColorDto,
  ) {
    return this.clothingColorService.update(id, updateClothingColorDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clothingColorService.remove(id);
  }
}