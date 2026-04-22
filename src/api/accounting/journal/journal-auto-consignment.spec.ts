/**
 * Tests para los métodos de consignación agregados a JournalAutoService.
 * Solo cubre los 8 métodos nuevos (F01-F08):
 *  - onConsignmentDispatchSent
 *  - onConsignmentReturnPortfolio
 *  - onConsignmentReturnWarranty
 *  - onConsignmentReturnPostSale
 *  - onConsignmentSelloutCompleted
 *  - onConsignmentMermaCompleted
 *  - onCycleCountShortage
 *  - onCycleCountSurplus
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JournalAutoService } from './journal-auto.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { TaxConfigService } from '../tax-config/tax-config.service';
import { ClosingService } from '../closing/closing.service';

const buildMockPrisma = () => {
  const tx = {
    pucAccount: { findUnique: jest.fn() },
    journalEntry: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    city: { findFirst: jest.fn() },
    consignmentDispatch: { findUnique: jest.fn() },
    consignmentReturn: { findUnique: jest.fn() },
    order: { findUnique: jest.fn() },
    inventoryCycleCount: { findUnique: jest.fn() },
  };
  const prisma = {
    ...tx,
    $transaction: jest.fn((cb: any) => cb(tx)),
  };
  return { prisma, tx };
};

// Helper: mock para pucAccount.findUnique que devuelve un objeto cuenta por código
const makeAccount = (code: string) => ({
  id: parseInt(code, 10) || 1,
  code,
  name: `Cuenta ${code}`,
  accepts_movements: true,
  is_active: true,
});

describe('JournalAutoService — Consignment methods', () => {
  let service: JournalAutoService;
  let mock: ReturnType<typeof buildMockPrisma>;
  let closingService: { isPeriodClosed: jest.Mock };

  beforeEach(async () => {
    mock = buildMockPrisma();
    closingService = { isPeriodClosed: jest.fn().mockResolvedValue(false) };

    // findUnique para pucAccount → devuelve la cuenta con el código pedido
    mock.prisma.pucAccount.findUnique.mockImplementation(({ where }: any) =>
      Promise.resolve(makeAccount(where.code)),
    );
    // getNextEntryNumber → busca lastEntry, devolvemos null para que empiece en 1
    mock.prisma.journalEntry.findFirst.mockResolvedValue(null);
    // create → passthrough
    mock.prisma.journalEntry.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 1, ...data }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalAutoService,
        { provide: PrismaService, useValue: mock.prisma },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(60) } },
        { provide: TaxConfigService, useValue: { calculateTaxes: jest.fn().mockResolvedValue([]) } },
        { provide: ClosingService, useValue: closingService },
      ],
    }).compile();
    service = module.get(JournalAutoService);
  });

  const dispatchWithItems = {
    id: 1,
    dispatch_number: 'DSP-000001',
    items: [
      {
        id: 1,
        quantity: 3,
        clothingSize: {
          product: { price: 100000 },
          clothingColor: { design: { manufactured_cost: 30000 } },
        },
      },
      {
        id: 2,
        quantity: 2,
        clothingSize: {
          product: { price: 50000 },
          clothingColor: { design: { manufactured_cost: 20000 } },
        },
      },
    ],
  };

  // ─── onConsignmentDispatchSent ────────────────────────────────────────
  describe('onConsignmentDispatchSent', () => {
    it('debita 143510 y acredita 143505 al costo', async () => {
      mock.prisma.consignmentDispatch.findUnique.mockResolvedValue(dispatchWithItems);

      await service.onConsignmentDispatchSent(1);

      // Total costo: 30000*3 + 20000*2 = 90000 + 40000 = 130000
      expect(mock.tx.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source_type: 'CONSIGNMENT_DISPATCH',
            total_debit: 130000,
            total_credit: 130000,
            lines: {
              create: expect.arrayContaining([
                expect.objectContaining({ debit: 130000, credit: 0 }),
                expect.objectContaining({ debit: 0, credit: 130000 }),
              ]),
            },
          }),
        }),
      );
    });

    it('retorna null si el periodo está cerrado', async () => {
      mock.prisma.consignmentDispatch.findUnique.mockResolvedValue(dispatchWithItems);
      closingService.isPeriodClosed.mockResolvedValue(true);

      const result = await service.onConsignmentDispatchSent(1);
      expect(result).toBeNull();
      expect(mock.tx.journalEntry.create).not.toHaveBeenCalled();
    });

    it('retorna null si el despacho no existe', async () => {
      mock.prisma.consignmentDispatch.findUnique.mockResolvedValue(null);
      const result = await service.onConsignmentDispatchSent(999);
      expect(result).toBeNull();
    });

    it('usa fallback al 60% del precio cuando manufactured_cost es 0', async () => {
      mock.prisma.consignmentDispatch.findUnique.mockResolvedValue({
        ...dispatchWithItems,
        items: [
          {
            id: 1,
            quantity: 1,
            clothingSize: {
              product: { price: 100000 },
              clothingColor: { design: { manufactured_cost: 0 } },
            },
          },
        ],
      });
      await service.onConsignmentDispatchSent(1);
      // 100000 * 60% = 60000
      expect(mock.tx.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ total_debit: 60000 }),
        }),
      );
    });
  });

  // ─── onConsignmentReturnPortfolio ─────────────────────────────────────
  describe('onConsignmentReturnPortfolio', () => {
    it('debita 143505 y acredita 143510 al costo (reverse del reclass)', async () => {
      mock.prisma.consignmentReturn.findUnique.mockResolvedValue({
        id: 1,
        return_type: 'PORTFOLIO',
        items: [
          {
            quantity: 2,
            clothingSize: {
              product: { price: 100000 },
              clothingColor: { design: { manufactured_cost: 30000 } },
            },
          },
        ],
      });

      await service.onConsignmentReturnPortfolio(1);
      // 30000*2 = 60000
      expect(mock.tx.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source_type: 'CONSIGNMENT_RETURN_PORTFOLIO',
            total_debit: 60000,
            total_credit: 60000,
          }),
        }),
      );
    });

    it('no procesa devoluciones que no sean PORTFOLIO', async () => {
      mock.prisma.consignmentReturn.findUnique.mockResolvedValue({
        id: 1,
        return_type: 'WARRANTY',
        items: [],
      });
      const result = await service.onConsignmentReturnPortfolio(1);
      expect(result).toBeNull();
      expect(mock.tx.journalEntry.create).not.toHaveBeenCalled();
    });
  });

  // ─── onConsignmentReturnWarranty ──────────────────────────────────────
  describe('onConsignmentReturnWarranty', () => {
    it('debita 519910 (gasto) y acredita 143510 al costo', async () => {
      mock.prisma.consignmentReturn.findUnique.mockResolvedValue({
        id: 1,
        return_type: 'WARRANTY',
        items: [
          {
            quantity: 1,
            clothingSize: {
              product: { price: 100000 },
              clothingColor: { design: { manufactured_cost: 30000 } },
            },
          },
        ],
      });

      await service.onConsignmentReturnWarranty(1);

      expect(mock.tx.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source_type: 'CONSIGNMENT_RETURN_WARRANTY',
            total_debit: 30000,
            total_credit: 30000,
          }),
        }),
      );
    });
  });

  // ─── onConsignmentReturnPostSale ──────────────────────────────────────
  describe('onConsignmentReturnPostSale', () => {
    it('genera 5 líneas: reverso ingresos, IVA, clientes + reverso COGS', async () => {
      mock.prisma.consignmentReturn.findUnique.mockResolvedValue({
        id: 1,
        return_type: 'POST_SALE',
        items: [
          {
            quantity: 2,
            unit_price: 50000,
            clothingSize: {
              product: { price: 100000 },
              clothingColor: { design: { manufactured_cost: 30000 } },
            },
          },
        ],
        order: { order_reference: 'SO-XYZ' },
      });

      await service.onConsignmentReturnPostSale(1);

      // subtotal venta: 50000*2 = 100000, IVA: 19000, total: 119000
      // costo: 30000*2 = 60000
      const callArg = (mock.tx.journalEntry.create as jest.Mock).mock.calls[0][0];
      expect(callArg.data.source_type).toBe('CONSIGNMENT_RETURN_POST_SALE');
      expect(callArg.data.lines.create).toHaveLength(5);
      // Débito total = subtotal + iva + cost = 100000 + 19000 + 60000 = 179000
      expect(callArg.data.total_debit).toBe(179000);
      // Crédito total = total + cost = 119000 + 60000 = 179000
      expect(callArg.data.total_credit).toBe(179000);
    });
  });

  // ─── onConsignmentSelloutCompleted ────────────────────────────────────
  describe('onConsignmentSelloutCompleted', () => {
    it('debita 130505 (CxC) por el total con IVA, acredita ingresos + IVA', async () => {
      mock.prisma.order.findUnique.mockResolvedValue({
        id: 1,
        order_reference: 'SO-1',
        status: 'SELLOUT',
        total_payment: 119000,
        iva: 19000,
        customer: { addresses: [] },
      });

      await service.onConsignmentSelloutCompleted(1);

      expect(mock.tx.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source_type: 'CONSIGNMENT_SELLOUT',
            total_debit: 119000,
            total_credit: 119000,
            lines: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({ debit: 119000, credit: 0 }), // Clientes
                expect.objectContaining({ debit: 0, credit: 100000 }), // Ingresos
                expect.objectContaining({ debit: 0, credit: 19000 }), // IVA
              ]),
            }),
          }),
        }),
      );
    });

    it('rechaza órdenes que no sean SELLOUT', async () => {
      mock.prisma.order.findUnique.mockResolvedValue({ id: 1, status: 'APPROVED' });
      const result = await service.onConsignmentSelloutCompleted(1);
      expect(result).toBeNull();
      expect(mock.tx.journalEntry.create).not.toHaveBeenCalled();
    });
  });

  // ─── onConsignmentMermaCompleted ──────────────────────────────────────
  describe('onConsignmentMermaCompleted', () => {
    it('debita 130505 y acredita 429505 (aprovechamientos) + IVA', async () => {
      mock.prisma.order.findUnique.mockResolvedValue({
        id: 1,
        order_reference: 'MERMA-1',
        status: 'MERMA',
        total_payment: 59500,
        iva: 9500,
      });

      await service.onConsignmentMermaCompleted(1);

      expect(mock.tx.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source_type: 'CONSIGNMENT_MERMA',
            total_debit: 59500,
            total_credit: 59500,
            lines: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({ debit: 59500 }), // Clientes
                expect.objectContaining({ credit: 50000 }), // Aprovechamientos
                expect.objectContaining({ credit: 9500 }), // IVA
              ]),
            }),
          }),
        }),
      );
    });

    it('rechaza órdenes que no sean MERMA', async () => {
      mock.prisma.order.findUnique.mockResolvedValue({ id: 1, status: 'SELLOUT' });
      const result = await service.onConsignmentMermaCompleted(1);
      expect(result).toBeNull();
    });
  });

  // ─── onCycleCountShortage ─────────────────────────────────────────────
  describe('onCycleCountShortage', () => {
    it('solo procesa ítems con real < teórico', async () => {
      mock.prisma.inventoryCycleCount.findUnique.mockResolvedValue({
        id: 1,
        status: 'APPROVED',
        items: [
          {
            // Faltante de 3 unidades
            theoretical_qty: 10,
            real_qty: 7,
            clothingSize: {
              product: { price: 100000 },
              clothingColor: { design: { manufactured_cost: 30000 } },
            },
          },
          {
            // Sin faltante (match)
            theoretical_qty: 5,
            real_qty: 5,
            clothingSize: {
              product: { price: 100000 },
              clothingColor: { design: { manufactured_cost: 30000 } },
            },
          },
          {
            // Sobrante (ignorado por este método)
            theoretical_qty: 2,
            real_qty: 4,
            clothingSize: {
              product: { price: 100000 },
              clothingColor: { design: { manufactured_cost: 30000 } },
            },
          },
        ],
      });

      await service.onCycleCountShortage(1);

      // Solo faltante: 3 * 30000 = 90000
      expect(mock.tx.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source_type: 'CYCLE_COUNT_SHORTAGE',
            total_debit: 90000,
            total_credit: 90000,
          }),
        }),
      );
    });

    it('retorna null si no hay faltantes', async () => {
      mock.prisma.inventoryCycleCount.findUnique.mockResolvedValue({
        id: 1,
        status: 'APPROVED',
        items: [
          {
            theoretical_qty: 10,
            real_qty: 10,
            clothingSize: {
              product: { price: 100000 },
              clothingColor: { design: { manufactured_cost: 30000 } },
            },
          },
        ],
      });
      const result = await service.onCycleCountShortage(1);
      expect(result).toBeNull();
      expect(mock.tx.journalEntry.create).not.toHaveBeenCalled();
    });

    it('rechaza conteos que no estén APPROVED', async () => {
      mock.prisma.inventoryCycleCount.findUnique.mockResolvedValue({
        id: 1,
        status: 'DRAFT',
        items: [],
      });
      const result = await service.onCycleCountShortage(1);
      expect(result).toBeNull();
    });
  });

  // ─── onCycleCountSurplus ──────────────────────────────────────────────
  describe('onCycleCountSurplus', () => {
    it('solo procesa ítems con real > teórico', async () => {
      mock.prisma.inventoryCycleCount.findUnique.mockResolvedValue({
        id: 1,
        status: 'APPROVED',
        items: [
          {
            // Sobrante de 2
            theoretical_qty: 5,
            real_qty: 7,
            clothingSize: {
              product: { price: 50000 },
              clothingColor: { design: { manufactured_cost: 20000 } },
            },
          },
          {
            // Faltante (ignorado)
            theoretical_qty: 10,
            real_qty: 8,
            clothingSize: {
              product: { price: 50000 },
              clothingColor: { design: { manufactured_cost: 20000 } },
            },
          },
        ],
      });

      await service.onCycleCountSurplus(1);

      // Solo sobrante: 2 * 20000 = 40000
      expect(mock.tx.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source_type: 'CYCLE_COUNT_SURPLUS',
            total_debit: 40000,
            total_credit: 40000,
          }),
        }),
      );
    });
  });
});
