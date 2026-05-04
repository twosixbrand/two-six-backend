import { Test, TestingModule } from '@nestjs/testing';
import { CashReceiptService } from './cash-receipt.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { JournalService } from '../journal/journal.service';
import { ClosingService } from '../closing/closing.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('CashReceiptService', () => {
  let service: CashReceiptService;
  let prisma: PrismaService;
  let journalService: JournalService;
  let closingService: ClosingService;

  const mockPrisma = {
    pucAccount: {
      findUnique: jest.fn(),
    },
    journalEntry: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    dianEInvoicing: {
      findMany: jest.fn(),
    },
  };

  const mockJournalService = {
    create: jest.fn(),
  };

  const mockClosingService = {
    isPeriodClosed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashReceiptService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JournalService, useValue: mockJournalService },
        { provide: ClosingService, useValue: mockClosingService },
      ],
    }).compile();

    service = module.get<CashReceiptService>(CashReceiptService);
    prisma = module.get<PrismaService>(PrismaService);
    journalService = module.get<JournalService>(JournalService);
    closingService = module.get<ClosingService>(ClosingService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCashReceipt', () => {
    const dto = {
      consignment_date: '2024-05-01',
      amount: 100000,
      bank_puc_code: '111005',
      advance_puc_code: '280505',
      reference: 'REF123',
      created_by: 1,
    };

    it('should throw ForbiddenException if period is closed', async () => {
      mockClosingService.isPeriodClosed.mockResolvedValue(true);
      await expect(service.createCashReceipt(dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if bank account does not exist', async () => {
      mockClosingService.isPeriodClosed.mockResolvedValue(false);
      mockPrisma.pucAccount.findUnique.mockResolvedValue(null);
      await expect(service.createCashReceipt(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if accounts are not auxiliary', async () => {
      mockClosingService.isPeriodClosed.mockResolvedValue(false);
      mockPrisma.pucAccount.findUnique.mockResolvedValue({ accepts_movements: false });
      await expect(service.createCashReceipt(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if advance account does not exist', async () => {
      mockClosingService.isPeriodClosed.mockResolvedValue(false);
      mockPrisma.pucAccount.findUnique.mockImplementation(({ where }) => {
        if (where.code === dto.bank_puc_code) return { accepts_movements: true };
        return null;
      });
      await expect(service.createCashReceipt(dto)).rejects.toThrow(NotFoundException);
    });

    it('should create journal entry correctly', async () => {
      mockClosingService.isPeriodClosed.mockResolvedValue(false);
      mockPrisma.pucAccount.findUnique.mockImplementation(({ where }) => {
        if (where.code === '111005') return { id: 1, code: '111005', accepts_movements: true };
        if (where.code === '280505') return { id: 2, code: '280505', accepts_movements: true };
        return null;
      });
      mockJournalService.create.mockResolvedValue({ id: 100, entry_number: 'AC-001', entry_date: new Date(), total_debit: 100000, lines: [] });

      const result = await service.createCashReceipt(dto);

      expect(result.journal_entry_id).toBe(100);
      expect(mockJournalService.create).toHaveBeenCalledWith(expect.objectContaining({
        source_type: 'CASH_RECEIPT',
        lines: expect.arrayContaining([
          expect.objectContaining({ id_puc_account: 1, debit: 100000 }),
          expect.objectContaining({ id_puc_account: 2, credit: 100000 }),
        ]),
      }));
    });
  });

  describe('getAvailableBalance', () => {
    it('should return 0 if entry is reversed', async () => {
      mockPrisma.journalEntry.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.journalEntry.findFirst.mockResolvedValue({ id: 2, source_type: 'REVERSAL' });
      
      const result = await service.getAvailableBalance(1, '280505');
      expect(result).toBe(0);
    });

    it('should calculate balance correctly subtracting applied invoices', async () => {
      const entry = {
        id: 1,
        lines: [
          { credit: 1000, pucAccount: { code: '280505' } }
        ]
      };
      mockPrisma.journalEntry.findUnique.mockResolvedValue(entry);
      mockPrisma.journalEntry.findFirst.mockResolvedValue(null); // No reversal
      
      // Applied invoices
      mockPrisma.dianEInvoicing.findMany.mockResolvedValue([{ id: 10 }]);
      
      // Journal entries for those invoices
      const appliedJournalEntry = {
        source_type: 'MANUAL_DIAN_INVOICE',
        lines: [
          { debit: 400, pucAccount: { code: '280505' } }
        ]
      };
      mockPrisma.journalEntry.findMany.mockResolvedValue([appliedJournalEntry]);

      const result = await service.getAvailableBalance(1, '280505');
      
      expect(result).toBe(600); // 1000 - 400
    });
  });

  describe('listPending', () => {
    it('should return only entries with balance > 0.01', async () => {
      const entries = [
        {
          id: 1,
          entry_number: 'AC-001',
          lines: [{ credit: 1000, pucAccount: { code: '280505' } }],
          metadata: JSON.stringify({ reference: 'REF1' })
        }
      ];
      mockPrisma.journalEntry.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce(entries);
      
      // Mock getAvailableBalance indirectly by mocking the prisma calls inside it or mocking the method if we could
      // Since we are testing the service, we let it call its own methods
      
      // Mock for getAvailableBalance inside listPending
      mockPrisma.journalEntry.findUnique.mockResolvedValue(entries[0]);
      mockPrisma.journalEntry.findFirst.mockResolvedValue(null);
      mockPrisma.dianEInvoicing.findMany.mockResolvedValue([]); // Nothing applied

      const result = await service.listPending('280505');

      expect(result).toHaveLength(1);
      expect(result[0].available_balance).toBe(1000);
    });

    it('should filter out reversed entries from list', async () => {
      mockPrisma.journalEntry.findMany.mockResolvedValueOnce([{ source_id: 1 }]); // reversedIds
      mockPrisma.journalEntry.findMany.mockResolvedValueOnce([]); // entries
      await service.listPending('280505');
      expect(mockPrisma.journalEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ id: { notIn: [1] } })
      }));
    });

    it('should handle metadata JSON parse error in listPending', async () => {
      const entries = [
        {
          id: 1,
          lines: [{ credit: 1000, pucAccount: { code: '280505' } }],
          metadata: 'invalid-json'
        }
      ];
      mockPrisma.journalEntry.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce(entries);
      mockPrisma.journalEntry.findUnique.mockResolvedValue(entries[0]);
      mockPrisma.journalEntry.findFirst.mockResolvedValue(null);
      mockPrisma.dianEInvoicing.findMany.mockResolvedValue([]);

      const result = await service.listPending('280505');
      expect(result[0].customer_nit).toBeNull();
    });
  });

  describe('getAvailableBalance Errors', () => {
    it('should throw NotFoundException if entry not found', async () => {
      mockPrisma.journalEntry.findUnique.mockResolvedValue(null);
      await expect(service.getAvailableBalance(999, '280505')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if advance line not found', async () => {
      mockPrisma.journalEntry.findUnique.mockResolvedValue({ id: 1, lines: [] });
      mockPrisma.journalEntry.findFirst.mockResolvedValue(null);
      await expect(service.getAvailableBalance(1, '280505')).rejects.toThrow(BadRequestException);
    });
  });
});
