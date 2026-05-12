import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { DianModule } from '../dian/dian.module';
import { AccountingModule } from '../accounting/accounting.module';
import { WompiModule } from '../wompi/wompi.module';

@Module({
  imports: [PrismaModule, MailerModule, DianModule, AccountingModule, WompiModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
