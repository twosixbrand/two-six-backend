import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ErrorLogModule } from './api/error-log/error-log.module';
import { ProductModule } from './api/product/product.module';
import { ClothingModule } from './api/clothing/clothing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ErrorLogModule,
    ProductModule,
    ClothingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
