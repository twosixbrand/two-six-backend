import { Module } from '@nestjs/common';
import { MasterDesignService } from './master-design.service';
import { MasterDesignController } from './master-design.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MasterDesignController],
  providers: [MasterDesignService],
})
export class MasterDesignModule {}