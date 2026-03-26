import { Test, TestingModule } from '@nestjs/testing';
import { DianController } from './dian.controller';
import { DianUblService } from './dian-ubl/dian-ubl.service';
import { DianSignerService } from './dian-signer/dian-signer.service';
import { DianCufeService } from './dian-cufe/dian-cufe.service';
import { DianSoapService } from './dian-soap/dian-soap.service';
import { DianPdfService } from './dian-pdf/dian-pdf.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

describe('DianController', () => {
  let controller: DianController;

  const mockUblService = { generateInvoiceXml: jest.fn(), generateCreditNoteXml: jest.fn(), generateDebitNoteXml: jest.fn() };
  const mockSignerService = { signXml: jest.fn() };
  const mockCufeService = { generateCufe: jest.fn(), generateCude: jest.fn() };
  const mockSoapService = { sendInvoice: jest.fn(), getStatusZip: jest.fn() };
  const mockPdfService = { generateQrBase64: jest.fn(), generateInvoicePdf: jest.fn() };
  const mockConfigService = { get: jest.fn() };
  const mockPrisma = {
    dianEInvoicing: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    dianResolution: { findFirst: jest.fn(), update: jest.fn() },
    dianNote: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    order: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DianController],
      providers: [
        { provide: DianUblService, useValue: mockUblService },
        { provide: DianSignerService, useValue: mockSignerService },
        { provide: DianCufeService, useValue: mockCufeService },
        { provide: DianSoapService, useValue: mockSoapService },
        { provide: DianPdfService, useValue: mockPdfService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<DianController>(DianController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
