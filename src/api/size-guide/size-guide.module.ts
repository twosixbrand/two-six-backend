import { Module } from '@nestjs/common';
import { SizeGuideService } from './size-guide.service';
import { SizeGuideController } from './size-guide.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SizeGuideService],
  controllers: [SizeGuideController]
})
export class SizeGuideModule { }
