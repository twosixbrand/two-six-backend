import { Test, TestingModule } from '@nestjs/testing';
import { ReconciliationService } from './reconciliation.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('ReconciliationService', () => {
  let service: ReconciliationService;
  const prismaMock: any = {
    journalEntryLine: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    pucAccount: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReconciliationService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get(ReconciliationService);
  });

  describe('mayorVsAuxiliar', () => {
    it('calcula balance recursivo de la cuenta mayor sumando auxiliares', async () => {
      prismaMock.journalEntryLine.groupBy.mockResolvedValue([
        { id_puc_account: 101, _sum: { debit: 1000, credit: 400 } }, // 143505: saldo 600
        { id_puc_account: 102, _sum: { debit: 500, credit: 100 } },  // 143510: saldo 400
      ]);
      prismaMock.pucAccount.findMany.mockResolvedValue([
        { id: 1, code: '14', name: 'Inventarios', parent_code: null, accepts_movements: false },
        { id: 2, code: '1435', name: 'Mercancías', parent_code: '14', accepts_movements: false },
        { id: 101, code: '143505', name: 'Propia', parent_code: '1435', accepts_movements: true },
        { id: 102, code: '143510', name: 'Consignación', parent_code: '1435', accepts_movements: true },
      ]);
      prismaMock.journalEntryLine.findMany.mockResolvedValue([]);

      const result = await service.mayorVsAuxiliar();

      const account1435 = result.accounts.find((a: any) => a.code === '1435')!;
      expect(account1435.balance).toBe(1000); // 600 + 400
      const account14 = result.accounts.find((a: any) => a.code === '14')!;
      expect(account14.balance).toBe(1000);

      const prop = result.accounts.find((a: any) => a.code === '143505')!;
      expect(prop.balance).toBe(600);
      const cons = result.accounts.find((a: any) => a.code === '143510')!;
      expect(cons.balance).toBe(400);
    });

    it('reporta movimientos inválidos sobre cuentas que no aceptan movimientos', async () => {
      prismaMock.journalEntryLine.groupBy.mockResolvedValue([]);
      prismaMock.pucAccount.findMany.mockResolvedValue([
        { id: 1, code: '14', name: 'Inventarios', parent_code: null, accepts_movements: false },
      ]);
      prismaMock.journalEntryLine.findMany.mockResolvedValue([
        {
          id: 999,
          debit: 100,
          credit: 0,
          pucAccount: { code: '14', name: 'Inventarios' },
          journalEntry: { entry_number: 'AC-000001', entry_date: new Date() },
        },
      ]);

      const result = await service.mayorVsAuxiliar();
      expect(result.summary.invalid_movements_count).toBe(1);
      expect(result.invalid_movements[0].account_code).toBe('14');
    });

    it('reporta cuentas huérfanas (parent_code inexistente)', async () => {
      prismaMock.journalEntryLine.groupBy.mockResolvedValue([]);
      prismaMock.pucAccount.findMany.mockResolvedValue([
        { id: 1, code: '999999', name: 'Huérfana', parent_code: 'NO-EXISTE', accepts_movements: true },
      ]);
      prismaMock.journalEntryLine.findMany.mockResolvedValue([]);

      const result = await service.mayorVsAuxiliar();
      expect(result.summary.orphan_accounts_count).toBe(1);
      expect(result.orphan_accounts[0].code).toBe('999999');
    });
  });
});
