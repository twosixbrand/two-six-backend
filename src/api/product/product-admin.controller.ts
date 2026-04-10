import { Controller, Get , UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';


@UseGuards(JwtAuthGuard)
@Controller('products-admin')
export class ProductAdminController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAllForAdmin() {
    return this.productService.findAllForAdmin();
  }
}