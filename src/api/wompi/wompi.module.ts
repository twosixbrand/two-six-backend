import { Module } from '@nestjs/common';
import { WompiService } from './wompi.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [WompiService],
  exports: [WompiService],
})
export class WompiModule {}
