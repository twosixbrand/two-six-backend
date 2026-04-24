import { Test, TestingModule } from '@nestjs/testing';
import { JournalAutoService } from './journal-auto.service';
import { JournalService } from './journal.service';
import { PucService } from '../puc/puc.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { TaxConfigService } from '../tax-config/tax-config.service';
import { ClosingService } from '../closing/closing.service';

describe('JournalAutoService', () => {
  let service: JournalAutoService;
  let journalService: JournalService;
  let pucService: PucService;

  const mockJournalService = {
    createEntry: jest.fn(),
  };

  const mockPucService = {
    findByCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalAutoService,
        { provide: JournalService, useValue: mockJournalService },
        { provide: PucService, useValue: mockPucService },
        { provide: PrismaService, useValue: {} },
        { provide: ConfigService, useValue: {} },
        { provide: TaxConfigService, useValue: {} },
        { provide: ClosingService, useValue: {} },
      ],
    }).compile();

    service = module.get<JournalAutoService>(JournalAutoService);
    journalService = module.get<JournalService>(JournalService);
    pucService = module.get<PucService>(PucService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onSaleCompleted', () => {
    it('should create a balanced journal entry for a standard sale', async () => {
      // Mock order data from Prisma
      const orderData = {
        id: 10,
        order_reference: 'FE100',
        total_payment: 119000,
        iva: 19000,
        payment_method: 'WOMPI_FULL',
        customer: { addresses: [] }
      };

      (service as any).prisma.order = {
        findUnique: jest.fn().mockResolvedValue(orderData)
      };

      // Mock PUC accounts lookup to simulate success
      (service as any).findAccountByCode = jest.fn().mockResolvedValue({ id: 1, code: 'dummy', is_active: true, accepts_movements: true });
      (service as any).closingService.isPeriodClosed = jest.fn().mockResolvedValue(false);
      (service as any).taxConfigService.calculateTaxes = jest.fn().mockResolvedValue([]);
      (service as any).getNextEntryNumber = jest.fn().mockResolvedValue('AC-000001');

      (service as any).prisma.$transaction = jest.fn().mockImplementation(async (cb) => {
        return cb((service as any).prisma);
      });

      (service as any).prisma.journalEntry = {
        create: jest.fn().mockResolvedValue({ id: 100 })
      };

      await service.onSaleCompleted(10);

      expect((service as any).findAccountByCode).toHaveBeenCalledTimes(5); // Bancos, IVA, Ingresos, Comision, IVA Comision
      expect((service as any).prisma.journalEntry.create).toHaveBeenCalledTimes(1);

      const createEntryArg = (service as any).prisma.journalEntry.create.mock.calls[0][0].data;
      
      expect(createEntryArg.source_type).toBe('SALE');
      expect(createEntryArg.source_id).toBe(10);
      expect(createEntryArg.description).toBe('Venta - Orden FE100');

      // Partida doble verification (Debitos = Creditos)
      expect(createEntryArg.total_debit).toBe(createEntryArg.total_credit);
      expect(createEntryArg.total_debit).toBeGreaterThan(0);
    });

    it('should throw an error if a required PUC account is missing', async () => {
      const orderData = {
        id: 11,
        total_payment: 119000,
        iva: 19000,
      };

      (service as any).prisma.order = {
        findUnique: jest.fn().mockResolvedValue(orderData)
      };
      (service as any).closingService.isPeriodClosed = jest.fn().mockResolvedValue(false);

      // Simulate missing account
      (service as any).findAccountByCode = jest.fn().mockRejectedValue(new Error('Missing account'));

      (service as any).prisma.$transaction = jest.fn().mockImplementation(async (cb) => {
        return cb((service as any).prisma);
      });

      await expect(service.onSaleCompleted(11)).rejects.toThrow();
    });
  });
});
