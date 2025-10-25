import { Module } from '@nestjs/common';
import { ClothingService } from './clothing.service';
import { ClothingController } from './clothing.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClothingController],
  providers: [ClothingService],
})
export class ClothingModule {}
