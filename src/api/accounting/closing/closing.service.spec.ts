import { Test, TestingModule } from '@nestjs/testing';
import { ClosingService } from './closing.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ClosingService', () => {
  let service: ClosingService;
  let prisma: PrismaService;

  const mockPrisma = {
    accountingClosing: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    journalEntryLine: {
      findMany: jest.fn(),
    },
    journalEntry: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    pucAccount: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
    $queryRawUnsafe: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClosingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<ClosingService>(ClosingService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isPeriodClosed', () => {
    it('should return true if a closing exists for the date', async () => {
      const date = new Date(2024, 0, 15); // Jan 15, 2024
      mockPrisma.accountingClosing.findFirst.mockResolvedValue({ id: 1 });

      const result = await service.isPeriodClosed(date);

      expect(result).toBe(true);
      expect(mockPrisma.accountingClosing.findFirst).toHaveBeenCalledWith({
        where: {
          year: 2024,
          OR: [{ month: 1, closing_type: 'MONTHLY' }, { closing_type: 'ANNUAL' }],
          status: 'CLOSED',
        },
      });
    });

    it('should return false if no closing exists', async () => {
      mockPrisma.accountingClosing.findFirst.mockResolvedValue(null);
      const result = await service.isPeriodClosed(new Date());
      expect(result).toBe(false);
    });
  });

  describe('closePeriod', () => {
    it('should throw BadRequestException for invalid month', async () => {
      await expect(service.closePeriod(2024, 13)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if already closed', async () => {
      mockPrisma.accountingClosing.findUnique.mockResolvedValue({ id: 1 });
      await expect(service.closePeriod(2024, 1)).rejects.toThrow('Ya existe un cierre');
    });

    it('should perform closing and create journal entry', async () => {
      mockPrisma.accountingClosing.findUnique.mockResolvedValue(null);
      
      // Lines for period
      const mockLines = [
        {
          id_puc_account: 101,
          credit: 1000,
          debit: 0,
          pucAccount: { code: '413505', name: 'Ingresos' },
        },
        {
          id_puc_account: 201,
          credit: 0,
          debit: 400,
          pucAccount: { code: '510505', name: 'Gastos' },
        },
      ];
      mockPrisma.journalEntryLine.findMany.mockResolvedValue(mockLines);
      
      // Result account
      mockPrisma.pucAccount.findUnique.mockResolvedValue({ id: 301, code: '360505' });
      
      // Entry number sequence mock
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ nextval: 123n }]);
      
      mockPrisma.journalEntry.create.mockResolvedValue({ id: 500 });
      mockPrisma.accountingClosing.create.mockResolvedValue({ id: 1, profit_loss: 600 });

      const result = await service.closePeriod(2024, 1, 'admin');

      expect(result).toBeDefined();
      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
      expect(mockPrisma.accountingClosing.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          profit_loss: 600,
          closed_by: 'admin',
        }),
      });
      expect(mockAuditService.log).toHaveBeenCalledWith('CLOSE_PERIOD', 'ACCOUNTING_CLOSING', 1, expect.any(String));
    });

    it('should fallback to MAX entry number if sequence fails', async () => {
      mockPrisma.accountingClosing.findUnique.mockResolvedValue(null);
      mockPrisma.journalEntryLine.findMany.mockResolvedValue([]);
      mockPrisma.pucAccount.findUnique.mockResolvedValue({ id: 301, code: '360505' });
      
      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('no seq'));
      mockPrisma.journalEntry.findFirst.mockResolvedValue({ entry_number: 'AC-000005' });
      
      mockPrisma.accountingClosing.create.mockResolvedValue({ id: 2 });

      await service.closePeriod(2024, 2);

      expect(mockPrisma.journalEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entry_number: 'AC-000006',
        }),
      });
    });
  });

  describe('annualClose', () => {
    it('should throw if annual closing exists', async () => {
      mockPrisma.accountingClosing.findUnique.mockResolvedValue({ id: 1 });
      await expect(service.annualClose(2024)).rejects.toThrow('Ya existe un cierre anual');
    });

    it('should transfer 3605 to 3705', async () => {
      // Month 1-12 already closed
      mockPrisma.accountingClosing.findUnique.mockImplementation(({ where }) => {
        if (where.year_month_closing_type?.closing_type === 'ANNUAL') return null;
        return { id: 99 };
      });
      
      // Monthly results (debit 3605, credit 3605)
      const mockResultLines = [
        {
          id_puc_account: 301,
          credit: 5000,
          debit: 0,
          pucAccount: { code: '360505', name: 'Utilidad' },
        },
      ];
      mockPrisma.journalEntryLine.findMany.mockResolvedValue(mockResultLines);
      mockPrisma.pucAccount.findUnique.mockResolvedValue({ id: 401, code: '370505' });
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ nextval: 999n }]);
      mockPrisma.journalEntry.create.mockResolvedValue({ id: 600 });
      mockPrisma.accountingClosing.create.mockResolvedValue({ id: 10 });

      const result = await service.annualClose(2024);

      expect(result.id).toBe(10);
      expect(mockPrisma.journalEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          source_type: 'ANNUAL_CLOSING',
        }),
      });
    });

    it('should skip months without movements in annualClose', async () => {
      mockPrisma.accountingClosing.findUnique.mockResolvedValue(null);
      // Simulate closePeriod throwing NotFoundException (no movements)
      const spy = jest.spyOn(service, 'closePeriod').mockRejectedValue(new NotFoundException());
      
      mockPrisma.journalEntryLine.findMany.mockResolvedValue([]);
      mockPrisma.accountingClosing.create.mockResolvedValue({ id: 20 });

      await service.annualClose(2024);
      expect(spy).toHaveBeenCalledTimes(12);
      spy.mockRestore();
    });
  });

  describe('Other methods', () => {
    it('should return all closings', async () => {
      mockPrisma.accountingClosing.findMany.mockResolvedValue([{ id: 1 }]);
      const result = await service.getClosings();
      expect(result).toHaveLength(1);
    });
  });

  describe('closePeriod extra branches', () => {
    it('should handle costs (class 6) and loss scenario', async () => {
      mockPrisma.accountingClosing.findUnique.mockResolvedValue(null);
      const mockLines = [
        {
          id_puc_account: 101,
          credit: 100,
          debit: 0,
          pucAccount: { code: '410505', name: 'Ingresos' },
        },
        {
          id_puc_account: 601,
          credit: 0,
          debit: 150,
          pucAccount: { code: '610505', name: 'Costos' },
        },
      ];
      mockPrisma.journalEntryLine.findMany.mockResolvedValue(mockLines);
      mockPrisma.pucAccount.findUnique.mockResolvedValue(null); // No exact match for 361005
      mockPrisma.pucAccount.findFirst.mockResolvedValue({ id: 302, code: '361005' }); // Fallback
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ nextval: 1n }]);
      mockPrisma.journalEntry.create.mockResolvedValue({ id: 1 });
      mockPrisma.accountingClosing.create.mockResolvedValue({ id: 1, profit_loss: -50 });

      await service.closePeriod(2024, 1);

      expect(mockPrisma.accountingClosing.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ profit_loss: -50 }),
      });
    });

    it('should log error if audit fails in closePeriod', async () => {
      mockPrisma.accountingClosing.findUnique.mockResolvedValue(null);
      mockPrisma.journalEntryLine.findMany.mockResolvedValue([]);
      mockPrisma.accountingClosing.create.mockResolvedValue({ id: 1 });
      mockAuditService.log.mockRejectedValue(new Error('audit fail'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await service.closePeriod(2024, 1);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error registrando auditoría'), 'audit fail');
      consoleSpy.mockRestore();
    });

    it('should throw if no result account is found anywhere', async () => {
      mockPrisma.accountingClosing.findUnique.mockResolvedValue(null);
      mockPrisma.journalEntryLine.findMany.mockResolvedValue([]);
      mockPrisma.pucAccount.findUnique.mockResolvedValue(null);
      mockPrisma.pucAccount.findFirst.mockResolvedValue(null);
      
      await expect(service.closePeriod(2024, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
