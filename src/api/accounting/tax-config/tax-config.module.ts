import { Module } from '@nestjs/common';
import { TaxConfigService } from './tax-config.service';
import { TaxConfigController } from './tax-config.controller';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TaxConfigController],
  providers: [TaxConfigService],
  exports: [TaxConfigService],
})
export class TaxConfigModule {}
