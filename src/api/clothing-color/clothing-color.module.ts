import { Module } from '@nestjs/common';
import { ClothingColorService } from './clothing-color.service';
import { ClothingColorController } from './clothing-color.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClothingColorController],
  providers: [ClothingColorService],
})
export class ClothingColorModule { }