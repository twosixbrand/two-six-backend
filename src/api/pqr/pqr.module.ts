import { Module } from '@nestjs/common';
import { PqrService } from './pqr.service';
import { PqrController } from './pqr.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    controllers: [PqrController],
    providers: [PqrService, PrismaService],
})
export class PqrModule { }
