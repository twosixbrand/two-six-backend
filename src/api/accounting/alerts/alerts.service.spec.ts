import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('AlertsService', () => {
  let service: AlertsService;
  const prismaMock: any = {
    journalEntry: { findMany: jest.fn() },
    journalEntryLine: { findMany: jest.fn() },
    pucAccount: { findMany: jest.fn() },
    order: { findMany: jest.fn() },
    accountingClosing: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get(AlertsService);
  });

  it('aggregates all alert categories and returns summary counts', async () => {
    prismaMock.journalEntry.findMany.mockResolvedValue([
      {
        id: 1,
        entry_number: 'AC-001',
        createdAt: new Date('2026-01-01'),
        description: 'x',
        source_type: 'SALE',
        total_debit: 100,
      },
    ]);
    // journalEntryLine.findMany se llama dos veces:
    //   1) invalid lines sobre cuentas no-movimiento
    //   2) distinct de id_puc_account usados recientemente
    prismaMock.journalEntryLine.findMany
      .mockResolvedValueOnce([
        {
          id: 99,
          debit: 100,
          credit: 0,
          pucAccount: { code: '14', name: 'Inventarios' },
          journalEntry: { entry_number: 'AC-002', entry_date: new Date() },
        },
      ])
      .mockResolvedValueOnce([{ id_puc_account: 10 }]);

    // pucAccount.findMany se llama 3 veces en orden:
    //   1) cuentas con parent_code (para orphans)
    //   2) SELECT code (para map allCodes)
    //   3) accepts_movements=true is_active=true (para idleAccounts)
    prismaMock.pucAccount.findMany
      .mockResolvedValueOnce([
        { id: 5, code: '999999', name: 'Huérfana', parent_code: 'NO-EXISTE' },
        { id: 6, code: '100', name: 'Ok', parent_code: '1' },
      ])
      .mockResolvedValueOnce([{ code: '1' }, { code: '100' }])
      .mockResolvedValueOnce([
        { id: 10, code: '111005', name: 'Bancos' }, // usado
        { id: 11, code: '143505', name: 'Inv' }, // idle
      ]);

    prismaMock.order.findMany.mockResolvedValue([
      {
        id: 1,
        order_reference: 'ORD-1',
        createdAt: new Date('2026-01-01'),
        total_payment: 100,
        status: 'APPROVED',
      },
    ]);
    prismaMock.accountingClosing.findFirst.mockResolvedValue(null);

    const result = await service.getAll();

    expect(result.summary.stale_drafts).toBe(1);
    expect(result.summary.invalid_movements).toBe(1);
    expect(result.summary.orphan_accounts).toBe(1);
    expect(result.orphan_accounts[0].code).toBe('999999');
    expect(result.summary.idle_accounts).toBe(1);
    expect(result.idle_accounts[0].code).toBe('143505');
    expect(result.summary.unbilled_orders).toBe(1);
    expect(Array.isArray(result.fiscal_deadlines)).toBe(true);
  });
});
