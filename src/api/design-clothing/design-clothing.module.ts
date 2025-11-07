import { Module } from '@nestjs/common';
import { DesignClothingService } from './design-clothing.service';
import { DesignClothingController } from './design-clothing.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DesignClothingController],
  providers: [DesignClothingService],
})
export class DesignClothingModule {}