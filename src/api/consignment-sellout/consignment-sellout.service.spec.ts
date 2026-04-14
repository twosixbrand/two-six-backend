import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConsignmentSelloutService } from './consignment-sellout.service';
import { ConsignmentPriceService } from '../consignment-price/consignment-price.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JournalAutoService } from '../accounting/journal/journal-auto.service';

const buildMockPrisma = () => {
  const tx = {
    customer: { findUnique: jest.fn() },
    consignmentWarehouse: { findUnique: jest.fn() },
    product: { findFirst: jest.fn() },
    consignmentStock: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    clothingSize: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    orderItem: { create: jest.fn() },
    inventoryKardex: { create: jest.fn() },
  };
  const prisma = {
    ...tx,
    $transaction: jest.fn((cb: any) => cb(tx)),
  };
  return { prisma, tx };
};

describe('ConsignmentSelloutService', () => {
  let service: ConsignmentSelloutService;
  let mock: ReturnType<typeof buildMockPrisma>;
  let priceService: { getEffectivePrice: jest.Mock };

  const ally = { id: 1, name: 'Ally', is_consignment_ally: true };
  const warehouse = { id: 2, id_customer: 1, name: 'Bodega A', address: 'Calle 1' };
  const product = {
    id: 50,
    id_clothing_size: 10,
    sku: 'SKU-1',
    price: 50000,
    clothingSize: {
      id: 10,
      size: { name: 'M' },
      clothingColor: {
        color: { name: 'Azul' },
        design: { id: 1, reference: 'CAM-001' },
      },
    },
  };

  beforeEach(async () => {
    mock = buildMockPrisma();
    priceService = { getEffectivePrice: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsignmentSelloutService,
        { provide: PrismaService, useValue: mock.prisma },
        { provide: ConsignmentPriceService, useValue: priceService },
        {
          provide: JournalAutoService,
          useValue: {
            onConsignmentSelloutCompleted: jest.fn().mockResolvedValue(null),
            onCostOfGoodsSold: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();
    service = module.get(ConsignmentSelloutService);
  });

  describe('preview', () => {
    it('rejects non-ally customer', async () => {
      mock.prisma.customer.findUnique.mockResolvedValue({ ...ally, is_consignment_ally: false });
      await expect(
        service.preview({ id_customer: 1, id_warehouse: 2, rows: [] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects warehouse not belonging to customer', async () => {
      mock.prisma.customer.findUnique.mockResolvedValue(ally);
      mock.prisma.consignmentWarehouse.findUnique.mockResolvedValue({ ...warehouse, id_customer: 99 });
      await expect(
        service.preview({ id_customer: 1, id_warehouse: 2, rows: [{ sku: 'X', quantity: 1 }] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('marks rows as error when product not found', async () => {
      mock.prisma.customer.findUnique.mockResolvedValue(ally);
      mock.prisma.consignmentWarehouse.findUnique.mockResolvedValue(warehouse);
      mock.prisma.product.findFirst.mockResolvedValue(null);

      const result = await service.preview({
        id_customer: 1,
        id_warehouse: 2,
        rows: [{ sku: 'MISSING', quantity: 1 }],
      });

      expect(result.resolved[0].status).toBe('error');
      expect(result.summary.error_count).toBe(1);
      expect(result.summary.ok_count).toBe(0);
    });

    it('uses effective consignment price when available', async () => {
      mock.prisma.customer.findUnique.mockResolvedValue(ally);
      mock.prisma.consignmentWarehouse.findUnique.mockResolvedValue(warehouse);
      mock.prisma.product.findFirst.mockResolvedValue(product);
      mock.prisma.consignmentStock.findUnique.mockResolvedValue({ quantity: 10 });
      priceService.getEffectivePrice.mockResolvedValue({ price: 40000 });

      const result = await service.preview({
        id_customer: 1,
        id_warehouse: 2,
        rows: [{ sku: 'SKU-1', quantity: 2 }],
      });

      expect(result.resolved[0].status).toBe('ok');
      expect(result.resolved[0].effective_price).toBe(40000);
      expect(result.summary.subtotal).toBe(80000);
      expect(result.summary.iva).toBeCloseTo(15200, 2);
      expect(result.summary.total).toBeCloseTo(95200, 2);
    });

    it('falls back to base product price when no consignment price', async () => {
      mock.prisma.customer.findUnique.mockResolvedValue(ally);
      mock.prisma.consignmentWarehouse.findUnique.mockResolvedValue(warehouse);
      mock.prisma.product.findFirst.mockResolvedValue(product);
      mock.prisma.consignmentStock.findUnique.mockResolvedValue({ quantity: 5 });
      priceService.getEffectivePrice.mockResolvedValue(null);

      const result = await service.preview({
        id_customer: 1,
        id_warehouse: 2,
        rows: [{ sku: 'SKU-1', quantity: 1 }],
      });

      expect(result.resolved[0].effective_price).toBe(50000);
    });

    it('honors price_override when provided', async () => {
      mock.prisma.customer.findUnique.mockResolvedValue(ally);
      mock.prisma.consignmentWarehouse.findUnique.mockResolvedValue(warehouse);
      mock.prisma.product.findFirst.mockResolvedValue(product);
      mock.prisma.consignmentStock.findUnique.mockResolvedValue({ quantity: 5 });
      priceService.getEffectivePrice.mockResolvedValue({ price: 40000 });

      const result = await service.preview({
        id_customer: 1,
        id_warehouse: 2,
        rows: [{ sku: 'SKU-1', quantity: 1, price_override: 99999 }],
      });

      expect(result.resolved[0].effective_price).toBe(99999);
    });

    it('flags insufficient warehouse stock', async () => {
      mock.prisma.customer.findUnique.mockResolvedValue(ally);
      mock.prisma.consignmentWarehouse.findUnique.mockResolvedValue(warehouse);
      mock.prisma.product.findFirst.mockResolvedValue(product);
      mock.prisma.consignmentStock.findUnique.mockResolvedValue({ quantity: 1 });

      const result = await service.preview({
        id_customer: 1,
        id_warehouse: 2,
        rows: [{ sku: 'SKU-1', quantity: 5 }],
      });

      expect(result.resolved[0].status).toBe('error');
      expect(result.resolved[0].message).toContain('Stock insuficiente');
    });
  });

  describe('process', () => {
    it('refuses to process when preview has errors', async () => {
      mock.prisma.customer.findUnique.mockResolvedValue(ally);
      mock.prisma.consignmentWarehouse.findUnique.mockResolvedValue(warehouse);
      mock.prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.process({
          id_customer: 1,
          id_warehouse: 2,
          rows: [{ sku: 'MISSING', quantity: 1 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
