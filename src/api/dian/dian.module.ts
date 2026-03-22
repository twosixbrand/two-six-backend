import { Module } from '@nestjs/common';
import { DianService } from './dian.service';
import { DianController } from './dian.controller';
import { DianUblService } from './dian-ubl/dian-ubl.service';
import { DianSignerService } from './dian-signer/dian-signer.service';
import { DianSoapService } from './dian-soap/dian-soap.service';
import { DianCufeService } from './dian-cufe/dian-cufe.service';
import { DianPdfService } from './dian-pdf/dian-pdf.service';
import { DianEmailService } from './dian-email.service';
import { DianCronService } from './dian-cron.service';

@Module({
  providers: [DianService, DianUblService, DianSignerService, DianSoapService, DianCufeService, DianPdfService, DianEmailService, DianCronService],
  controllers: [DianController],
  exports: [DianUblService, DianSignerService, DianSoapService, DianCufeService, DianPdfService, DianEmailService, DianService]
})
export class DianModule {}
