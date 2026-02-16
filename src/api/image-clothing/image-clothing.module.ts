import { Module } from '@nestjs/common';
import { ImageClothingService } from './image-clothing.service';
import { ImageClothingController } from './image-clothing.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    controllers: [ImageClothingController],
    providers: [ImageClothingService, PrismaService],
})
export class ImageClothingModule { }
