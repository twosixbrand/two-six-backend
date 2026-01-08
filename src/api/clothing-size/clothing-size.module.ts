import { Module } from '@nestjs/common';
import { ClothingSizeService } from './clothing-size.service';
import { ClothingSizeController } from './clothing-size.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    controllers: [ClothingSizeController],
    providers: [ClothingSizeService, PrismaService],
    exports: [ClothingSizeService], // Export service in case other modules need it
})
export class ClothingSizeModule { }
