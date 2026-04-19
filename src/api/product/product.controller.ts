import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
  Header,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { QueryProductDto } from './dto/query-product.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get()
  findAll(@Query() query: QueryProductDto): Promise<Product[]> {
    return this.productService.findAll(query.gender, query.is_outlet);
  }

  @Get('feed')
  findAllForGoogleFeed() {
    return this.productService.findAllForGoogleFeed();
  }

  @Get('facebook-feed.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200')
  getFacebookFeedXml() {
    // In production, this might come from env config, but keeping it simple based on your architecture.
    return this.productService.getFacebookFeedXml('https://twosixweb.com');
  }

  @Get('store/designs')
  findDesignsForStore(
    @Query('gender') gender?: any,
    @Query('is_outlet') is_outlet?: boolean,
    @Query('category') category?: string,
    @Query('tag') tag?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 12;
    // Cast gender string to Enum if present
    return this.productService.findDesignsForStore(gender, is_outlet, category, tag, pageNumber, limitNumber);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Get('by-reference/:reference')
  findByDesignReference(
    @Param('reference') reference: string,
  ): Promise<(Product & { clothingSize: any })[]> {
    return this.productService.findByDesignReference(reference);
  }

  @Get('by-slug/:slug')
  findByClothingColorSlug(
    @Param('slug') slug: string,
  ): Promise<{ products: (Product & { clothingSize: any })[], colorId: number | null }> {
    return this.productService.findByClothingColorSlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}
