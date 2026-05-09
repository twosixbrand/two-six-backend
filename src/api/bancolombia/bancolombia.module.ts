import { Module } from '@nestjs/common';
import { BancolombiaService } from './bancolombia.service';
import { BancolombiaController } from './bancolombia.controller';
import { OrderModule } from '../order/order.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [OrderModule, PrismaModule],
  controllers: [BancolombiaController],
  providers: [BancolombiaService],
  exports: [BancolombiaService],
})
export class BancolombiaModule {}
