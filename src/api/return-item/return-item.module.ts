import { Module } from '@nestjs/common';
import { ReturnItemService } from './return-item.service';
import { ReturnItemController } from './return-item.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReturnItemController],
  providers: [ReturnItemService],
})
export class ReturnItemModule {}
