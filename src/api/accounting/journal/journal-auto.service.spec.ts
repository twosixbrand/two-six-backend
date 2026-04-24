import { Test, TestingModule } from '@nestjs/testing';
import { JournalAutoService } from './journal-auto.service';
import { JournalService } from './journal.service';
import { PucService } from '../puc/puc.service';

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

  describe('logSalesInvoice', () => {
    it('should create a balanced journal entry for a standard sale', async () => {
      const saleData = {
        invoiceNumber: 'FE100',
        customerId: 10,
        subtotal: 100000,
        iva: 19000,
        total: 119000,
        paymentMethod: 'WOMPI_FULL',
        date: new Date(),
        description: 'Venta online #10',
      };

      // Mock PUC accounts lookup to simulate success
      mockPucService.findByCode.mockResolvedValue({ id: 1, code: 'dummy', is_active: true, accepts_movements: true });
      mockJournalService.createEntry.mockResolvedValue({ id: 100 });

      await service.logSalesInvoice(saleData);

      expect(mockPucService.findByCode).toHaveBeenCalledTimes(4); // Cuentas por cobrar, IVA, Ingresos, Costo
      expect(mockJournalService.createEntry).toHaveBeenCalledTimes(1);

      const createEntryArg = mockJournalService.createEntry.mock.calls[0][0];
      
      expect(createEntryArg.type).toBe('SALE');
      expect(createEntryArg.reference).toBe('FE100');
      expect(createEntryArg.description).toBe('Venta online #10');

      // Partida doble verification (Debitos = Creditos)
      const debits = createEntryArg.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
      const credits = createEntryArg.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

      expect(debits).toBe(credits);
      expect(debits).toBeGreaterThan(0);
    });

    it('should throw an error if a required PUC account is missing', async () => {
      const saleData = {
        invoiceNumber: 'FE101',
        customerId: 10,
        subtotal: 100000,
        iva: 19000,
        total: 119000,
        paymentMethod: 'WOMPI_FULL',
        date: new Date(),
        description: 'Venta',
      };

      // Simulate missing account
      mockPucService.findByCode.mockResolvedValue(null);

      await expect(service.logSalesInvoice(saleData)).rejects.toThrow();
    });
  });
});
