import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { PrismaModule } from './prisma/prisma.module';
import { LogsModule } from './api/logs/logs.module';

@Module({
  imports: [PrismaModule, ProductsModule, LogsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
