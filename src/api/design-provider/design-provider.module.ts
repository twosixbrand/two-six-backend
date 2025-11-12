import { Module } from '@nestjs/common';
import { DesignProviderService } from './design-provider.service';
import { DesignProviderController } from './design-provider.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DesignProviderController],
  providers: [DesignProviderService],
})
export class DesignProviderModule {}
