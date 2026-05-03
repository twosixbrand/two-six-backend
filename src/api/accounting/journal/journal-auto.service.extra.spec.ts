import { Test, TestingModule } from '@nestjs/testing';
import { JournalAutoService } from './journal-auto.service';
import { JournalService } from './journal.service';
import { PucService } from '../puc/puc.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { TaxConfigService } from '../tax-config/tax-config.service';
import { ClosingService } from '../closing/closing.service';
import { NotFoundException } from '@nestjs/common';

describe('JournalAutoService Extra', () => {
  let service: JournalAutoService;
  let prisma: PrismaService;

  const mockPrisma = {
    expense: { findUnique: jest.fn() },
    order: { findUnique: jest.fn() },
    inventoryAdjustment: { findUnique: jest.fn(), update: jest.fn() },
    pucAccount: { findUnique: jest.fn(), findFirst: jest.fn() },
    journalEntry: { create: jest.fn() },
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
  };

  const mockClosingService = {
    isPeriodClosed: jest.fn().mockResolvedValue(false),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(60),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalAutoService,
        { provide: JournalService, useValue: {} },
        { provide: PucService, useValue: {} },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: TaxConfigService, useValue: {} },
        { provide: ClosingService, useValue: mockClosingService },
      ],
    }).compile();

    service = module.get<JournalAutoService>(JournalAutoService);
    prisma = module.get<PrismaService>(PrismaService);
    
    // Mock private methods if needed or rely on prisma mocks
    (service as any).getNextEntryNumber = jest.fn().mockResolvedValue('AE-001');
    (service as any).findAccountByCode = jest.fn().mockResolvedValue({ id: 1, code: '1' });
    
    jest.clearAllMocks();
  });

  describe('onExpenseCreated', () => {
    it('should create a journal entry for an expense', async () => {
      const expense = {
        id: 1,
        expense_number: 'EXP-001',
        description: 'Office supplies',
        subtotal: 100,
        tax_amount: 19,
        retention_amount: 0,
        total: 119,
        id_puc_account: 50,
      };
      mockPrisma.expense.findUnique.mockResolvedValue(expense);
      mockPrisma.journalEntry.create.mockResolvedValue({ id: 100 });
      
      await service.onExpenseCreated(1);
      
      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
      const callArgs = mockPrisma.journalEntry.create.mock.calls[0][0].data;
      expect(callArgs.source_type).toBe('EXPENSE');
      expect(callArgs.total_debit).toBe(119);
    });

    it('should throw NotFoundException if expense not found', async () => {
      mockPrisma.expense.findUnique.mockResolvedValue(null);
      await expect(service.onExpenseCreated(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('onCostOfGoodsSold', () => {
    it('should create a COGS journal entry', async () => {
      const order = {
        id: 1,
        order_reference: 'TS-001',
        orderItems: [
          {
            quantity: 2,
            unit_price: 100,
            product: {
              clothingSize: {
                clothingColor: {
                  design: { manufactured_cost: 40 }
                }
              }
            }
          }
        ]
      };
      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.pucAccount.findUnique.mockResolvedValue({ id: 10, code: '613535' });
      mockPrisma.journalEntry.create.mockResolvedValue({ id: 101 });
      
      await service.onCostOfGoodsSold(1);
      
      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
      const callArgs = mockPrisma.journalEntry.create.mock.calls[0][0].data;
      expect(callArgs.source_type).toBe('COGS');
      expect(callArgs.total_debit).toBe(80); // 40 * 2
    });
  });

  describe('onInventoryAdjustment', () => {
    it('should create an adjustment journal entry', async () => {
      const adjustment = {
        id: 1,
        reason: 'MERMA',
        items: [{ unit_cost: 50, quantity: -2 }]
      };
      mockPrisma.inventoryAdjustment.findUnique.mockResolvedValue(adjustment);
      mockPrisma.journalEntry.create.mockResolvedValue({ id: 102 });
      
      await service.onInventoryAdjustment(1);
      
      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
      const callArgs = mockPrisma.journalEntry.create.mock.calls[0][0].data;
      expect(callArgs.source_type).toBe('INVENTORY_ADJUSTMENT');
      expect(callArgs.total_debit).toBe(100);
    });
  });
});
