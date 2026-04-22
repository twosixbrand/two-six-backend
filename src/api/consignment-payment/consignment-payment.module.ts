import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsignmentPaymentService } from './consignment-payment.service';
import { ConsignmentPaymentController } from './consignment-payment.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ConsignmentPaymentController],
  providers: [ConsignmentPaymentService],
  exports: [ConsignmentPaymentService],
})
export class ConsignmentPaymentModule {}
