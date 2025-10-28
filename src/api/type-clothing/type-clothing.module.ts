import { Module } from '@nestjs/common';
import { TypeClothingService } from './type-clothing.service';
import { TypeClothingController } from './type-clothing.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TypeClothingController],
  providers: [TypeClothingService],
})
export class TypeClothingModule {}
