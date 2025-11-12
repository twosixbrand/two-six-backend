import { Module } from '@nestjs/common';
import { ProductionTypeService } from './production-type.service';
import { ProductionTypeController } from './production-type.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductionTypeController],
  providers: [ProductionTypeService],
})
export class ProductionTypeModule {}
