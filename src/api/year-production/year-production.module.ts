import { Module } from '@nestjs/common';
import { YearProductionService } from './year-production.service';
import { YearProductionController } from './year-production.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [YearProductionController],
  providers: [YearProductionService],
})
export class YearProductionModule {}