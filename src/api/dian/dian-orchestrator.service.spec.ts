import { Test, TestingModule } from '@nestjs/testing';
import { DianOrchestratorService } from './dian-orchestrator.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { DianUblService } from './dian-ubl/dian-ubl.service';
import { DianSignerService } from './dian-signer/dian-signer.service';
import { DianCufeService } from './dian-cufe/dian-cufe.service';
import { DianSoapService } from './dian-soap/dian-soap.service';
import { DianPdfService } from './dian-pdf/dian-pdf.service';

describe('DianOrchestratorService', () => {
  let service: DianOrchestratorService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockPrismaService = {
    dianResolution: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
    },
    dianEInvoicing: {
      create: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
      if (key === 'DIAN_ENVIRONMENT') return 'TEST';
      if (key === 'DIAN_COMPANY_NIT') return '901234567';
      if (key === 'DIAN_TECHNICAL_KEY') return 'test-key';
      return defaultValue;
    }),
  };

  const mockUblService = {
    generateInvoiceXml: jest.fn().mockReturnValue('<xml>CUFE_PLACEHOLDER</xml>'),
  };

  const mockSignerService = {
    signXml: jest.fn().mockReturnValue('<xml>SIGNED</xml>'),
  };

  const mockCufeService = {
    generateCufe: jest.fn().mockReturnValue('mocked-cufe'),
  };

  const mockSoapService = {
    sendInvoice: jest.fn().mockResolvedValue({ status: 'Exitoso' }),
  };

  const mockPdfService = {
    generateQrBase64: jest.fn().mockResolvedValue('base64qr'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DianOrchestratorService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DianUblService, useValue: mockUblService },
        { provide: DianSignerService, useValue: mockSignerService },
        { provide: DianCufeService, useValue: mockCufeService },
        { provide: DianSoapService, useValue: mockSoapService },
        { provide: DianPdfService, useValue: mockPdfService },
      ],
    }).compile();

    service = module.get<DianOrchestratorService>(DianOrchestratorService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAndSendInvoice', () => {
    it('should throw an error if no active resolution is found', async () => {
      mockPrismaService.dianResolution.findFirst.mockResolvedValueOnce(null);

      await expect(service.generateAndSendInvoice({})).rejects.toThrow(
        'No hay resolución DIAN activa configurada',
      );
    });

    it('should throw an error if resolution numbers are exhausted', async () => {
      mockPrismaService.dianResolution.findFirst.mockResolvedValueOnce({
        id: 1,
        isActive: true,
        environment: 'TEST',
        type: 'INVOICE',
        currentNumber: 100,
        endNumber: 100,
      });

      await expect(service.generateAndSendInvoice({})).rejects.toThrow(
        'Se agotó el rango de numeración DIAN',
      );
    });

    it('should successfully generate and send an invoice for POS sale', async () => {
      const activeResolution = {
        id: 1,
        isActive: true,
        environment: 'TEST',
        type: 'INVOICE',
        prefix: 'SETP',
        currentNumber: 10,
        endNumber: 100,
        startNumber: 1,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-01-01'),
        resolutionNumber: '18760000001',
        technicalKey: 'test-key',
      };
      
      mockPrismaService.dianResolution.findFirst.mockResolvedValueOnce(activeResolution);
      mockPrismaService.dianResolution.update.mockResolvedValueOnce(activeResolution);
      mockPrismaService.dianEInvoicing.create.mockResolvedValueOnce({ id: 99 });

      const payload = {
        customerName: 'Juan Perez',
        customerDoc: '12345678',
        customerDocType: '13',
        lines: [
          { description: 'Camiseta', quantity: 2, unitPrice: 50000, taxPercent: 19 }
        ]
      };

      const result = await service.generateAndSendInvoice(payload);

      expect(mockPrismaService.dianResolution.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { currentNumber: 11 },
      });
      expect(mockCufeService.generateCufe).toHaveBeenCalled();
      expect(mockUblService.generateInvoiceXml).toHaveBeenCalled();
      expect(mockSignerService.signXml).toHaveBeenCalled();
      expect(mockSoapService.sendInvoice).toHaveBeenCalled();
      expect(mockPrismaService.dianEInvoicing.create).toHaveBeenCalled();
      
      expect(result).toEqual({
        success: true,
        invoiceNumber: 'SETP11',
        cufe: 'mocked-cufe',
        dianRecordId: 99,
        response: { status: 'Exitoso' },
      });
    });
  });
});
