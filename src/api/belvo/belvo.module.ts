import { Module } from '@nestjs/common';
import { BelvoService } from './belvo.service';
import { BelvoController } from './belvo.controller';
import { OrderModule } from '../order/order.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [OrderModule, PrismaModule],
  controllers: [BelvoController],
  providers: [BelvoService],
})
export class BelvoModule {}
