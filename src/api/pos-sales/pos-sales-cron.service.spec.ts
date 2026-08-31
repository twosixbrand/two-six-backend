import { Test, TestingModule } from '@nestjs/testing';
import { PosSalesCronService } from './pos-sales-cron.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DianOrchestratorService } from '../dian/dian-orchestrator.service';
import { JournalAutoService } from '../accounting/journal/journal-auto.service';

describe('PosSalesCronService', () => {
  let service: PosSalesCronService;
  let prismaService: PrismaService;
  let dianOrchestrator: DianOrchestratorService;
  let journalAutoService: JournalAutoService;

  const mockPrismaService = {
    posSale: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockDianOrchestrator = {
    generateAndSendInvoice: jest.fn(),
  };

  const mockJournalAutoService = {
    onPosSaleCompleted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosSalesCronService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: DianOrchestratorService, useValue: mockDianOrchestrator },
        { provide: JournalAutoService, useValue: mockJournalAutoService },
      ],
    }).compile();

    service = module.get<PosSalesCronService>(PosSalesCronService);
    prismaService = module.get<PrismaService>(PrismaService);
    dianOrchestrator = module.get<DianOrchestratorService>(
      DianOrchestratorService,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processQueuedPosSales', () => {
    it('should skip processing if already processing', async () => {
      // Simulate isProcessing = true
      (service as any).isProcessing = true;
      await service.processQueuedPosSales();

      expect(mockPrismaService.posSale.findMany).not.toHaveBeenCalled();
    });

    it('should handle no queued sales gracefully', async () => {
      mockPrismaService.posSale.findMany.mockResolvedValueOnce([]);

      await service.processQueuedPosSales();

      expect(mockPrismaService.posSale.findMany).toHaveBeenCalledWith({
        where: { status: 'QUEUED' },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });
      expect(
        mockDianOrchestrator.generateAndSendInvoice,
      ).not.toHaveBeenCalled();
    });

    it('should successfully process queued sales and update status to INVOICED', async () => {
      const mockSales = [
        {
          id: 1,
          status: 'QUEUED',
          customerName: 'Juan',
          customerDoc: '1111',
          lines: JSON.stringify([
            { product_name: 'Camisa', quantity: 2, unit_price: 50000 },
          ]),
        },
      ];
      mockPrismaService.posSale.findMany.mockResolvedValueOnce(mockSales);
      mockDianOrchestrator.generateAndSendInvoice.mockResolvedValueOnce({
        success: true,
        dianRecordId: 99,
      });

      await service.processQueuedPosSales();

      expect(mockDianOrchestrator.generateAndSendInvoice).toHaveBeenCalledWith({
        customerName: 'Juan',
        customerDoc: '1111',
        customerDocType: '13',
        lines: [
          {
            description: 'Camisa',
            quantity: 2,
            unitPrice: 50000,
            taxPercent: 19,
          },
        ],
        paymentMethod: undefined,
        date: expect.any(String),
        time: expect.any(String),
      });

      expect(mockPrismaService.posSale.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'INVOICED',
          id_dian_invoice: 99,
          dian_error_msg: null,
        },
      });
    });

    it('should handle DIAN error and update status to ERROR', async () => {
      const mockSales = [
        {
          id: 2,
          status: 'QUEUED',
          lines: '[]',
        },
      ];
      mockPrismaService.posSale.findMany.mockResolvedValueOnce(mockSales);
      mockDianOrchestrator.generateAndSendInvoice.mockRejectedValueOnce(
        new Error('DIAN Timeout'),
      );

      await service.processQueuedPosSales();

      expect(mockPrismaService.posSale.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { status: 'ERROR', dian_error_msg: 'DIAN Timeout' },
      });
    });
  });
});
