import { Module } from '@nestjs/common';
import { ProviderDocumentController } from './provider-document.controller';
import { ProviderDocumentService } from './provider-document.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProviderDocumentController],
  providers: [ProviderDocumentService],
})
export class ProviderDocumentModule {}
