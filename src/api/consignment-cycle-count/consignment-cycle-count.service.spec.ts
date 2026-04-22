import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConsignmentCycleCountService } from './consignment-cycle-count.service';
import { ConsignmentPriceService } from '../consignment-price/consignment-price.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JournalAutoService } from '../accounting/journal/journal-auto.service';

const buildMockPrisma = () => {
  const tx = {
    consignmentWarehouse: { findUnique: jest.fn() },
    consignmentStock: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    inventoryCycleCount: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    inventoryCycleCountItem: {
      update: jest.fn(),
    },
    clothingSize: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    inventoryKardex: { create: jest.fn() },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    orderItem: { create: jest.fn() },
  };
  const prisma = {
    ...tx,
    $transaction: jest.fn((cb: any) => cb(tx)),
  };
  return { prisma, tx };
};

describe('ConsignmentCycleCountService', () => {
  let service: ConsignmentCycleCountService;
  let mock: ReturnType<typeof buildMockPrisma>;

  beforeEach(async () => {
    mock = buildMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsignmentCycleCountService,
        { provide: PrismaService, useValue: mock.prisma },
        {
          provide: ConsignmentPriceService,
          useValue: { getEffectivePrice: jest.fn().mockResolvedValue(null) },
        },
        {
          provide: JournalAutoService,
          useValue: {
            onCycleCountShortage: jest.fn().mockResolvedValue(null),
            onCycleCountSurplus: jest.fn().mockResolvedValue(null),
            onConsignmentMermaCompleted: jest.fn().mockResolvedValue(null),
            onCostOfGoodsSold: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();
    service = module.get(ConsignmentCycleCountService);
  });

  describe('create', () => {
    it('snapshots EN_CONSIGNACION stock into items', async () => {
      mock.prisma.consignmentWarehouse.findUnique.mockResolvedValue({ id: 1 });
      mock.prisma.consignmentStock.findMany.mockResolvedValue([
        { id_clothing_size: 10, quantity: 5 },
        { id_clothing_size: 11, quantity: 3 },
      ]);
      mock.prisma.inventoryCycleCount.create.mockResolvedValue({ id: 1 });

      await service.create({ id_warehouse: 1 });

      expect(mock.prisma.consignmentStock.findMany).toHaveBeenCalledWith({
        where: {
          id_warehouse: 1,
          status: 'EN_CONSIGNACION',
          quantity: { gt: 0 },
        },
      });
      expect(mock.prisma.inventoryCycleCount.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id_warehouse: 1,
            items: {
              create: [
                { id_clothing_size: 10, theoretical_qty: 5, real_qty: null },
                { id_clothing_size: 11, theoretical_qty: 3, real_qty: null },
              ],
            },
          }),
        }),
      );
    });

    it('refuses when warehouse has no stock', async () => {
      mock.prisma.consignmentWarehouse.findUnique.mockResolvedValue({ id: 1 });
      mock.prisma.consignmentStock.findMany.mockResolvedValue([]);
      await expect(service.create({ id_warehouse: 1 })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('approve', () => {
    it('refuses approval when any item is uncounted', async () => {
      mock.tx.inventoryCycleCount.findUnique.mockResolvedValue({
        id: 1,
        status: 'DRAFT',
        id_warehouse: 2,
        items: [
          { id: 1, id_clothing_size: 10, theoretical_qty: 5, real_qty: 5 },
          { id: 2, id_clothing_size: 11, theoretical_qty: 3, real_qty: null },
        ],
      });
      await expect(service.approve(1)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('applies shortage: decrements consignment stock and records kardex OUT', async () => {
      mock.tx.inventoryCycleCount.findUnique.mockResolvedValue({
        id: 1,
        status: 'DRAFT',
        id_warehouse: 2,
        items: [
          { id: 1, id_clothing_size: 10, theoretical_qty: 5, real_qty: 3 }, // faltante 2
        ],
      });
      mock.tx.clothingSize.findUnique.mockResolvedValue({
        id: 10,
        quantity_available: 100,
      });
      mock.tx.consignmentStock.findUnique.mockResolvedValue({ id: 200, quantity: 10 });
      mock.tx.inventoryCycleCount.update.mockResolvedValue({ id: 1, status: 'APPROVED' });

      await service.approve(1);

      expect(mock.tx.consignmentStock.update).toHaveBeenCalledWith({
        where: { id: 200 },
        data: { quantity: { decrement: 2 } },
      });
      expect(mock.tx.clothingSize.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { quantity_on_consignment: { decrement: 2 } },
      });
      expect(mock.tx.inventoryKardex.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'OUT',
          source_type: 'CYCLE_COUNT_SHORTAGE',
          quantity: 2,
        }),
      });
    });

    it('applies surplus: increments consignment stock and records kardex IN', async () => {
      mock.tx.inventoryCycleCount.findUnique.mockResolvedValue({
        id: 2,
        status: 'DRAFT',
        id_warehouse: 2,
        items: [
          { id: 1, id_clothing_size: 10, theoretical_qty: 5, real_qty: 7 }, // sobrante 2
        ],
      });
      mock.tx.clothingSize.findUnique.mockResolvedValue({ id: 10, quantity_available: 100 });
      mock.tx.consignmentStock.findUnique.mockResolvedValue({ id: 200, quantity: 5 });
      mock.tx.inventoryCycleCount.update.mockResolvedValue({ id: 2, status: 'APPROVED' });

      await service.approve(2);

      expect(mock.tx.consignmentStock.update).toHaveBeenCalledWith({
        where: { id: 200 },
        data: { quantity: { increment: 2 } },
      });
      expect(mock.tx.inventoryKardex.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'IN',
          source_type: 'CYCLE_COUNT_SURPLUS',
          quantity: 2,
        }),
      });
    });

    it('skips items where real matches theoretical (no side effects)', async () => {
      mock.tx.inventoryCycleCount.findUnique.mockResolvedValue({
        id: 3,
        status: 'DRAFT',
        id_warehouse: 2,
        items: [{ id: 1, id_clothing_size: 10, theoretical_qty: 5, real_qty: 5 }],
      });
      mock.tx.inventoryCycleCount.update.mockResolvedValue({ id: 3, status: 'APPROVED' });

      await service.approve(3);

      expect(mock.tx.consignmentStock.update).not.toHaveBeenCalled();
      expect(mock.tx.clothingSize.update).not.toHaveBeenCalled();
      expect(mock.tx.inventoryKardex.create).not.toHaveBeenCalled();
    });
  });

  describe('createMermaInvoice', () => {
    it('refuses if cycle count not APPROVED', async () => {
      mock.prisma.inventoryCycleCount.findUnique.mockResolvedValue({
        id: 1,
        status: 'DRAFT',
        items: [],
      });
      await expect(
        service.createMermaInvoice(1, { price_mode: 'CONSIGNMENT' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses if already invoiced', async () => {
      mock.prisma.inventoryCycleCount.findUnique.mockResolvedValue({
        id: 1,
        status: 'APPROVED',
        merma_order_id: 999,
        items: [],
      });
      await expect(
        service.createMermaInvoice(1, { price_mode: 'CONSIGNMENT' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('PENALTY mode requires positive unit price', async () => {
      mock.prisma.inventoryCycleCount.findUnique.mockResolvedValue({
        id: 1,
        status: 'APPROVED',
        merma_order_id: null,
        warehouse: { id: 2, id_customer: 5 },
        items: [
          {
            id_clothing_size: 10,
            theoretical_qty: 5,
            real_qty: 2,
            clothingSize: {
              size: { name: 'M' },
              clothingColor: { color: { name: 'Azul' }, design: { reference: 'REF-1' } },
              product: { id: 50, id_clothing_size: 10, price: 30000 },
            },
          },
        ],
      });
      await expect(
        service.createMermaInvoice(1, { price_mode: 'PENALTY' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses if no shortages found', async () => {
      mock.prisma.inventoryCycleCount.findUnique.mockResolvedValue({
        id: 1,
        status: 'APPROVED',
        merma_order_id: null,
        warehouse: { id: 2, id_customer: 5 },
        items: [
          {
            id_clothing_size: 10,
            theoretical_qty: 5,
            real_qty: 5, // sin faltante
            clothingSize: {
              size: { name: 'M' },
              clothingColor: { color: { name: 'Azul' }, design: { reference: 'REF-1' } },
              product: { id: 50 },
            },
          },
        ],
      });
      await expect(
        service.createMermaInvoice(1, { price_mode: 'CONSIGNMENT' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
