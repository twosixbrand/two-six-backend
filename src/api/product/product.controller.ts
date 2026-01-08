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
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { QueryProductDto } from './dto/query-product.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get()
  findAll(@Query() query: QueryProductDto): Promise<Product[]> {
    return this.productService.findAll(query.gender, query.is_outlet);
  }

  @Get('store/designs')
  findDesignsForStore(
    @Query('gender') gender?: any,
    @Query('is_outlet') is_outlet?: boolean
  ) {
    // Cast gender string to Enum if present
    return this.productService.findDesignsForStore(gender, is_outlet);
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

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}
