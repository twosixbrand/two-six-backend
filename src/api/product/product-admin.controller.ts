import { Controller, Get } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('products-admin')
export class ProductAdminController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAllForAdmin() {
    return this.productService.findAllForAdmin();
  }
}