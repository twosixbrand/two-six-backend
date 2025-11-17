import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProductAdminController } from './product-admin.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ProductController, ProductAdminController],
  providers: [ProductService],
})
export class ProductModule {}
