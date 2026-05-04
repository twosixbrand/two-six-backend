import { Test, TestingModule } from '@nestjs/testing';
import { DianCronService } from './dian-cron.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DianSoapService } from './dian-soap/dian-soap.service';
import { DianEmailService } from './dian-email.service';

describe('DianCronService', () => {
  let service: DianCronService;

  const mockPrisma = {
    dianEInvoicing: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockSoapService = {
    getStatusZip: jest.fn(),
  };

  const mockEmailService = {
    sendDianInvoiceEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DianCronService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: DianSoapService, useValue: mockSoapService },
        { provide: DianEmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<DianCronService>(DianCronService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── pollDianInvoices ───────────────────────────────────────────────

  describe('pollDianInvoices', () => {
    it('should do nothing when there are no pending invoices', async () => {
      mockPrisma.dianEInvoicing.findMany.mockResolvedValue([]);

      await service.pollDianInvoices();

      expect(mockSoapService.getStatusZip).not.toHaveBeenCalled();
      expect(mockPrisma.dianEInvoicing.update).not.toHaveBeenCalled();
    });

    it('should retry email for AUTHORIZED invoices with email_sent=false', async () => {
      const invoice = {
        id: 1,
        document_number: 'FE001',
        status: 'AUTHORIZED',
        email_sent: false,
        dian_response: '<b:ZipKey>abc</b:ZipKey>',
      };
      mockPrisma.dianEInvoicing.findMany.mockResolvedValue([invoice]);
      mockEmailService.sendDianInvoiceEmail.mockResolvedValue(true);

      await service.pollDianInvoices();

      expect(mockEmailService.sendDianInvoiceEmail).toHaveBeenCalledWith(1);
      // Should NOT call getStatusZip because it continues after email retry
      expect(mockSoapService.getStatusZip).not.toHaveBeenCalled();
    });

    it('should skip invoices without dian_response', async () => {
      const invoice = {
        id: 2,
        document_number: 'FE002',
        status: 'SENT',
        email_sent: false,
        dian_response: null,
      };
      mockPrisma.dianEInvoicing.findMany.mockResolvedValue([invoice]);

      await service.pollDianInvoices();

      expect(mockSoapService.getStatusZip).not.toHaveBeenCalled();
      expect(mockPrisma.dianEInvoicing.update).not.toHaveBeenCalled();
    });

    it('should skip invoices without ZipKey in dian_response', async () => {
      const invoice = {
        id: 3,
        document_number: 'FE003',
        status: 'SENT',
        email_sent: false,
        dian_response: '<some>xml without zipkey</some>',
      };
      mockPrisma.dianEInvoicing.findMany.mockResolvedValue([invoice]);

      await service.pollDianInvoices();

      expect(mockSoapService.getStatusZip).not.toHaveBeenCalled();
    });

    it('should update status to AUTHORIZED when IsValid=true and StatusCode=00', async () => {
      const invoice = {
        id: 4,
        document_number: 'FE004',
        status: 'SENT',
        email_sent: false,
        dian_response: '<b:ZipKey>zip-key-123</b:ZipKey>',
      };
      mockPrisma.dianEInvoicing.findMany.mockResolvedValue([invoice]);

      const soapResponse = `
        <b:IsValid>true</b:IsValid>
        <b:StatusCode>00</b:StatusCode>
        <b:StatusDescription>Aprobado</b:StatusDescription>
        <b:XmlBase64Bytes>base64content</b:XmlBase64Bytes>
      `;
      mockSoapService.getStatusZip.mockResolvedValue(soapResponse);
      mockPrisma.dianEInvoicing.update.mockResolvedValue({});
      mockEmailService.sendDianInvoiceEmail.mockResolvedValue(true);

      await service.pollDianInvoices();

      expect(mockSoapService.getStatusZip).toHaveBeenCalledWith('zip-key-123');
      expect(mockPrisma.dianEInvoicing.update).toHaveBeenCalledWith({
        where: { id: 4 },
        data: expect.objectContaining({
          status: 'AUTHORIZED',
          dian_zip_base64: 'base64content',
          dian_authorized_at: expect.any(Date),
        }),
      });
      // Should send email after authorization
      expect(mockEmailService.sendDianInvoiceEmail).toHaveBeenCalledWith(4);
    });

    it('should update status to AUTHORIZED for sandbox StatusCode=2', async () => {
      const invoice = {
        id: 5,
        document_number: 'FE005',
        status: 'SENT',
        email_sent: false,
        dian_response: '<b:ZipKey>zip-sandbox</b:ZipKey>',
      };
      mockPrisma.dianEInvoicing.findMany.mockResolvedValue([invoice]);

      const soapResponse = `
        <b:IsValid>false</b:IsValid>
        <b:StatusCode>2</b:StatusCode>
        <b:StatusDescription>Set de Pruebas Aceptado</b:StatusDescription>
      `;
      mockSoapService.getStatusZip.mockResolvedValue(soapResponse);
      mockPrisma.dianEInvoicing.update.mockResolvedValue({});
      mockEmailService.sendDianInvoiceEmail.mockResolvedValue(true);

      await service.pollDianInvoices();

      expect(mockPrisma.dianEInvoicing.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: expect.objectContaining({
          status: 'AUTHORIZED',
          dian_authorized_at: expect.any(Date),
        }),
      });
    });

    it('should update status to REJECTED for StatusCode >= 60', async () => {
      const invoice = {
        id: 6,
        document_number: 'FE006',
        status: 'SENT',
        email_sent: false,
        dian_response: '<b:ZipKey>zip-reject</b:ZipKey>',
      };
      mockPrisma.dianEInvoicing.findMany.mockResolvedValue([invoice]);

      const soapResponse = `
        <b:IsValid>false</b:IsValid>
        <b:StatusCode>66</b:StatusCode>
        <b:StatusDescription>Documento rechazado</b:StatusDescription>
      `;
      mockSoapService.getStatusZip.mockResolvedValue(soapResponse);
      mockPrisma.dianEInvoicing.update.mockResolvedValue({});

      await service.pollDianInvoices();

      expect(mockPrisma.dianEInvoicing.update).toHaveBeenCalledWith({
        where: { id: 6 },
        data: expect.objectContaining({
          status: 'REJECTED',
        }),
      });
      // Should NOT send email on rejection
      expect(mockEmailService.sendDianInvoiceEmail).not.toHaveBeenCalled();
    });

    it('should NOT overwrite dian_response when updating status', async () => {
      const invoice = {
        id: 7,
        document_number: 'FE007',
        status: 'SENT',
        email_sent: false,
        dian_response: '<b:ZipKey>original-zip-key</b:ZipKey>',
      };
      mockPrisma.dianEInvoicing.findMany.mockResolvedValue([invoice]);

      const soapResponse = `
        <b:IsValid>true</b:IsValid>
        <b:StatusCode>00</b:StatusCode>
        <b:StatusDescription>OK</b:StatusDescription>
        <b:XmlBase64Bytes>newbase64</b:XmlBase64Bytes>
      `;
      mockSoapService.getStatusZip.mockResolvedValue(soapResponse);
      mockPrisma.dianEInvoicing.update.mockResolvedValue({});
      mockEmailService.sendDianInvoiceEmail.mockResolvedValue(true);

      await service.pollDianInvoices();

      // The update call should NOT include dian_response
      const updateCall = mockPrisma.dianEInvoicing.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('dian_response');
    });

    it('should handle errors gracefully without crashing the loop', async () => {
      const invoices = [
        {
          id: 8,
          document_number: 'FE008',
          status: 'SENT',
          email_sent: false,
          dian_response: '<b:ZipKey>zip-err</b:ZipKey>',
        },
        {
          id: 9,
          document_number: 'FE009',
          status: 'SENT',
          email_sent: false,
          dian_response: '<b:ZipKey>zip-ok</b:ZipKey>',
        },
      ];
      mockPrisma.dianEInvoicing.findMany.mockResolvedValue(invoices);

      // First call errors, second succeeds
      mockSoapService.getStatusZip.mockRejectedValueOnce(
        new Error('SOAP timeout'),
      ).mockResolvedValueOnce(`
          <b:IsValid>true</b:IsValid>
          <b:StatusCode>00</b:StatusCode>
          <b:StatusDescription>OK</b:StatusDescription>
        `);
      mockPrisma.dianEInvoicing.update.mockResolvedValue({});
      mockEmailService.sendDianInvoiceEmail.mockResolvedValue(true);

      // Should not throw
      await expect(service.pollDianInvoices()).resolves.not.toThrow();

      // Second invoice should still be processed
      expect(mockSoapService.getStatusZip).toHaveBeenCalledTimes(2);
      expect(mockPrisma.dianEInvoicing.update).toHaveBeenCalledTimes(1);
    });

    it('should log error if email retry fails', async () => {
      const invoice = {
        id: 10,
        status: 'AUTHORIZED',
        email_sent: false,
        document_number: 'FE010',
      };
      mockPrisma.dianEInvoicing.findMany.mockResolvedValue([invoice]);
      mockEmailService.sendDianInvoiceEmail.mockRejectedValue(new Error('Email error'));
      
      const loggerSpy = jest.spyOn((service as any).logger, 'error');
      
      await service.pollDianInvoices();
      
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error retrying email'),
        expect.any(Error),
      );
      loggerSpy.mockRestore();
    });

    it('should skip if soap response is empty or not a string', async () => {
      const invoice = {
        id: 11,
        status: 'SENT',
        dian_response: '<b:ZipKey>abc</b:ZipKey>',
        document_number: 'FE011',
      };
      mockPrisma.dianEInvoicing.findMany.mockResolvedValue([invoice]);
      mockSoapService.getStatusZip.mockResolvedValue(null);
      
      await service.pollDianInvoices();
      
      expect(mockPrisma.dianEInvoicing.update).not.toHaveBeenCalled();
    });

    it('should update status to PROCESSED for other non-UNKNOWN status codes', async () => {
      const invoice = {
        id: 12,
        status: 'SENT',
        dian_response: '<b:ZipKey>abc</b:ZipKey>',
        document_number: 'FE012',
      };
      mockPrisma.dianEInvoicing.findMany.mockResolvedValue([invoice]);
      
      const soapResponse = `
        <b:IsValid>false</b:IsValid>
        <b:StatusCode>05</b:StatusCode>
        <b:StatusDescription>Validación en proceso</b:StatusDescription>
      `;
      mockSoapService.getStatusZip.mockResolvedValue(soapResponse);
      mockPrisma.dianEInvoicing.update.mockResolvedValue({});
      
      await service.pollDianInvoices();
      
      expect(mockPrisma.dianEInvoicing.update).toHaveBeenCalledWith({
        where: { id: 12 },
        data: expect.objectContaining({
          status: 'PROCESSED',
        }),
      });
    });

    it('should do nothing if status is UNKNOWN', async () => {
      const invoice = {
        id: 13,
        status: 'SENT',
        dian_response: '<b:ZipKey>abc</b:ZipKey>',
        document_number: 'FE013',
      };
      mockPrisma.dianEInvoicing.findMany.mockResolvedValue([invoice]);
      
      const soapResponse = `
        <b:IsValid>false</b:IsValid>
        <b:StatusCode>UNKNOWN</b:StatusCode>
      `;
      mockSoapService.getStatusZip.mockResolvedValue(soapResponse);
      
      await service.pollDianInvoices();
      
      expect(mockPrisma.dianEInvoicing.update).not.toHaveBeenCalled();
    });
  });
});
