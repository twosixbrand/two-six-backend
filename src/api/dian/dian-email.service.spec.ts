import { Test, TestingModule } from '@nestjs/testing';
import { DianEmailService } from './dian-email.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { DianUblService } from './dian-ubl/dian-ubl.service';
import { DianSignerService } from './dian-signer/dian-signer.service';
import { DianPdfService } from './dian-pdf/dian-pdf.service';

// Mock nodemailer before the module loads
const mockSendMail = jest.fn();
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
  })),
}));

// Mock adm-zip
jest.mock('adm-zip', () => {
  return jest.fn().mockImplementation(() => ({
    addFile: jest.fn(),
    toBuffer: jest.fn().mockReturnValue(Buffer.from('fake-zip')),
  }));
});

describe('DianEmailService', () => {
  let service: DianEmailService;

  const mockPrisma = {
    dianEInvoicing: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    dianResolution: {
      findFirst: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultVal?: any) => {
      const map: Record<string, string> = {
        DIAN_EMAIL_USER: 'dian@twosix.co',
        DIAN_EMAIL_PASSWORD: 'secret',
        EMAIL_SERVER_HOST: 'smtp.gmail.com',
        EMAIL_SERVER_PORT: '465',
        DIAN_COMPANY_NAME: 'TWO SIX S.A.S.',
      };
      return map[key] ?? defaultVal ?? undefined;
    }),
  };

  const mockUblService = {
    generateInvoiceXml: jest
      .fn()
      .mockReturnValue('<xml>CUFE_PLACEHOLDER</xml>'),
  };

  const mockSignerService = {
    signXml: jest.fn().mockReturnValue('<xml>signed</xml>'),
  };

  const mockPdfService = {
    generateInvoicePdf: jest.fn().mockResolvedValue(Buffer.from('fake-pdf')),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DianEmailService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DianUblService, useValue: mockUblService },
        { provide: DianSignerService, useValue: mockSignerService },
        { provide: DianPdfService, useValue: mockPdfService },
      ],
    }).compile();

    service = module.get<DianEmailService>(DianEmailService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── sendDianInvoiceEmail ────────────────────────────────────────────

  describe('sendDianInvoiceEmail', () => {
    const baseInvoice = {
      id: 1,
      document_number: 'FE001',
      cufe_code: 'cufe-abc-123',
      issue_date: new Date('2026-03-25'),
      environment: 'TEST',
      email_sent: false,
      id_dian_resolution: 1,
      order: {
        id: 10,
        customer: {
          id: 20,
          name: 'Juan Test',
          email: 'juan@test.com',
          document_number: '123456',
          id_identification_type: 1,
        },
        orderItems: [
          { product_name: 'Camiseta', quantity: 1, unit_price: 50000 },
        ],
      },
    };

    const baseResolution = {
      id: 1,
      prefix: 'FE',
      resolutionNumber: 'RES-001',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2026-12-31'),
      startNumber: 1,
      endNumber: 999,
    };

    it('should return false if invoice not found', async () => {
      mockPrisma.dianEInvoicing.findUnique.mockResolvedValue(null);

      const result = await service.sendDianInvoiceEmail(999);
      expect(result).toBe(false);
    });

    it('should return true without resending if email_sent is already true', async () => {
      mockPrisma.dianEInvoicing.findUnique.mockResolvedValue({
        ...baseInvoice,
        email_sent: true,
      });

      const result = await service.sendDianInvoiceEmail(1);
      expect(result).toBe(true);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should generate XML, PDF, ZIP and send email successfully', async () => {
      mockPrisma.dianEInvoicing.findUnique.mockResolvedValue(baseInvoice);
      mockPrisma.dianResolution.findFirst.mockResolvedValue(baseResolution);
      mockSendMail.mockResolvedValue({ messageId: 'msg-123' });
      mockPrisma.dianEInvoicing.update.mockResolvedValue({});

      const result = await service.sendDianInvoiceEmail(1);

      expect(result).toBe(true);

      // Should generate UBL XML with CUFE replaced
      expect(mockUblService.generateInvoiceXml).toHaveBeenCalledWith(
        expect.objectContaining({
          number: 'FE001',
          customerName: 'Juan Test',
          customerDoc: '123456',
        }),
      );

      // Should sign the XML
      expect(mockSignerService.signXml).toHaveBeenCalled();

      // Should generate PDF
      expect(mockPdfService.generateInvoicePdf).toHaveBeenCalledWith(
        baseInvoice,
        baseResolution,
      );

      // Should send email with zip attachment
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'juan@test.com',
          subject: expect.stringContaining('FE001'),
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: 'Factura_Electronica_FE001.zip',
            }),
          ]),
        }),
      );

      // Should mark as sent
      expect(mockPrisma.dianEInvoicing.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { email_sent: true },
      });
    });

    it('should include QR/CUFE info in the email HTML', async () => {
      mockPrisma.dianEInvoicing.findUnique.mockResolvedValue(baseInvoice);
      mockPrisma.dianResolution.findFirst.mockResolvedValue(baseResolution);
      mockSendMail.mockResolvedValue({});
      mockPrisma.dianEInvoicing.update.mockResolvedValue({});

      await service.sendDianInvoiceEmail(1);

      const mailCall = mockSendMail.mock.calls[0][0];
      expect(mailCall.html).toContain('cufe-abc-123');
      expect(mailCall.html).toContain('FE001');
    });

    it('should return false and not crash when sendMail throws', async () => {
      mockPrisma.dianEInvoicing.findUnique.mockResolvedValue(baseInvoice);
      mockPrisma.dianResolution.findFirst.mockResolvedValue(baseResolution);
      mockSendMail.mockRejectedValue(new Error('SMTP connection refused'));

      const result = await service.sendDianInvoiceEmail(1);

      expect(result).toBe(false);
      // Should NOT mark as sent
      expect(mockPrisma.dianEInvoicing.update).not.toHaveBeenCalled();
    });

    it('should include BCC to the dian sender email', async () => {
      mockPrisma.dianEInvoicing.findUnique.mockResolvedValue(baseInvoice);
      mockPrisma.dianResolution.findFirst.mockResolvedValue(baseResolution);
      mockSendMail.mockResolvedValue({});
      mockPrisma.dianEInvoicing.update.mockResolvedValue({});

      await service.sendDianInvoiceEmail(1);

      const mailCall = mockSendMail.mock.calls[0][0];
      expect(mailCall.bcc).toBe('dian@twosix.co');
    });
  });
});
