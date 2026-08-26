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
  UploadedFiles,
  InternalServerErrorException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ClothingColorService } from './clothing-color.service';
import { CreateClothingColorDto } from './dto/create-clothing-color.dto';
import { UpdateClothingColorDto } from './dto/update-clothing-color.dto';
import { ApiOkResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ClothingColorEntity } from './entities/clothing-color.entity';
import { Express } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('clothing-color')
export class ClothingColorController {
  constructor(private readonly clothingColorService: ClothingColorService) {}

  @Post()
  create(@Body() createClothingColorDto: CreateClothingColorDto) {
    return this.clothingColorService.create(createClothingColorDto);
  }

  @Post('contextual')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id_design: { type: 'integer' },
        id_color: { type: 'integer' },
        slug: { type: 'string' },
        sizes: { type: 'string', description: 'JSON string of sizes array' },
      },
    },
  })
  async createContextual(
    @Body()
    body: {
      id_design: string;
      id_color: string;
      slug?: string;
      seo_title?: string;
      seo_desc?: string;
      seo_h1?: string;
      seo_alt?: string;
      sizes: string;
    },
  ) {
    try {
      console.log('Controller createContextual received body:', body);

      const id_design = parseInt(body.id_design, 10);
      const id_color = parseInt(body.id_color, 10);
      const slug = body.slug;
      const seo_title = body.seo_title;
      const seo_desc = body.seo_desc;
      const seo_h1 = body.seo_h1;
      const seo_alt = body.seo_alt;
      let sizes;

      try {
        sizes = JSON.parse(body.sizes);
      } catch (e) {
        throw new BadRequestException(
          `Invalid sizes JSON format: ${e.message}`,
        );
      }

      if (!sizes || !Array.isArray(sizes)) {
        throw new BadRequestException('Sizes must be a valid array');
      }

      return await this.clothingColorService.createContextual(
        id_design,
        id_color,
        slug,
        seo_title,
        seo_desc,
        seo_h1,
        seo_alt,
        sizes,
      );
    } catch (error) {
      console.error('Controller Error in createContextual:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Unexpected error processing request',
      );
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
