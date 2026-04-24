import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConsignmentReturnService } from './consignment-return.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JournalAutoService } from '../accounting/journal/journal-auto.service';

const buildMockPrisma = () => {
  const tx = {
    consignmentReturn: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    consignmentWarehouse: { findUnique: jest.fn() },
    order: { findUnique: jest.fn() },
    consignmentStock: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    clothingSize: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    inventoryKardex: { create: jest.fn() },
  };
  const prisma = {
    ...tx,
    $transaction: jest.fn((cb: any) => cb(tx)),
  };
  return { prisma, tx };
};

describe('ConsignmentReturnService', () => {
  let service: ConsignmentReturnService;
  let mock: ReturnType<typeof buildMockPrisma>;

  beforeEach(async () => {
    mock = buildMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsignmentReturnService,
        { provide: PrismaService, useValue: mock.prisma },
        {
          provide: JournalAutoService,
          useValue: {
            onConsignmentReturnPortfolio: jest.fn().mockResolvedValue(null),
            onConsignmentReturnWarranty: jest.fn().mockResolvedValue(null),
            onConsignmentReturnPostSale: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();
    service = module.get(ConsignmentReturnService);
  });

  describe('create', () => {
    it('rejects empty items', async () => {
      await expect(
        service.create({
          id_warehouse: 1,
          return_type: 'PORTFOLIO',
          items: [],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('POST_SALE requires id_order', async () => {
      mock.prisma.consignmentWarehouse.findUnique.mockResolvedValue({
        id: 1,
        id_customer: 5,
      });
      await expect(
        service.create({
          id_warehouse: 1,
          return_type: 'POST_SALE',
          items: [{ id_clothing_size: 1, quantity: 1, unit_price: 100 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('POST_SALE requires unit_price on each item', async () => {
      mock.prisma.consignmentWarehouse.findUnique.mockResolvedValue({
        id: 1,
        id_customer: 5,
      });
      mock.prisma.order.findUnique.mockResolvedValue({
        id: 10,
        id_customer: 5,
      });
      await expect(
        service.create({
          id_warehouse: 1,
          return_type: 'POST_SALE',
          id_order: 10,
          items: [{ id_clothing_size: 1, quantity: 1 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('POST_SALE rejects order from different customer', async () => {
      mock.prisma.consignmentWarehouse.findUnique.mockResolvedValue({
        id: 1,
        id_customer: 5,
      });
      mock.prisma.order.findUnique.mockResolvedValue({
        id: 10,
        id_customer: 99,
      });
      await expect(
        service.create({
          id_warehouse: 1,
          return_type: 'POST_SALE',
          id_order: 10,
          items: [{ id_clothing_size: 1, quantity: 1, unit_price: 100 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates PORTFOLIO return in DRAFT', async () => {
      mock.prisma.consignmentWarehouse.findUnique.mockResolvedValue({
        id: 1,
        id_customer: 5,
      });
      mock.prisma.consignmentReturn.create.mockImplementation(
        ({ data }: any) => ({ id: 1, ...data }),
      );
      const result = await service.create({
        id_warehouse: 1,
        return_type: 'PORTFOLIO',
        items: [{ id_clothing_size: 1, quantity: 2 }],
      });
      expect(result.id).toBe(1);
    });
  });

  describe('process', () => {
    it('rejects processing when not DRAFT', async () => {
      mock.tx.consignmentReturn.findUnique.mockResolvedValue({
        id: 1,
        status: 'PROCESSED',
        items: [],
      });
      await expect(service.process(1)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('PORTFOLIO: returns stock to quantity_available', async () => {
      mock.tx.consignmentReturn.findUnique.mockResolvedValue({
        id: 1,
        status: 'DRAFT',
        return_type: 'PORTFOLIO',
        id_warehouse: 2,
        items: [{ id_clothing_size: 10, quantity: 3 }],
      });
      mock.tx.clothingSize.findUnique.mockResolvedValue({
        id: 10,
        quantity_available: 5,
      });
      mock.tx.consignmentStock.findUnique.mockResolvedValue({
        id: 100,
        quantity: 10,
      });
      mock.tx.consignmentReturn.update.mockResolvedValue({
        id: 1,
        status: 'PROCESSED',
      });

      await service.process(1);

      expect(mock.tx.clothingSize.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          quantity_available: { increment: 3 },
          quantity_on_consignment: { decrement: 3 },
        },
      });
      expect(mock.tx.inventoryKardex.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          source_type: 'CONSIGNMENT_RETURN_PORTFOLIO',
          type: 'IN',
        }),
      });
    });

    it('WARRANTY: marks as warranty without adding to available', async () => {
      mock.tx.consignmentReturn.findUnique.mockResolvedValue({
        id: 2,
        status: 'DRAFT',
        return_type: 'WARRANTY',
        id_warehouse: 2,
        items: [{ id_clothing_size: 10, quantity: 1 }],
      });
      mock.tx.clothingSize.findUnique.mockResolvedValue({
        id: 10,
        quantity_available: 5,
      });
      mock.tx.consignmentStock.findUnique.mockResolvedValue({
        id: 100,
        quantity: 5,
      });
      mock.tx.consignmentReturn.update.mockResolvedValue({ id: 2 });

      await service.process(2);

      expect(mock.tx.clothingSize.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          quantity_under_warranty: { increment: 1 },
          quantity_on_consignment: { decrement: 1 },
        },
      });
      expect(mock.tx.inventoryKardex.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          source_type: 'CONSIGNMENT_RETURN_WARRANTY',
        }),
      });
    });

    it('POST_SALE: decrements quantity_sold and increments available', async () => {
      mock.tx.consignmentReturn.findUnique.mockResolvedValue({
        id: 3,
        status: 'DRAFT',
        return_type: 'POST_SALE',
        id_warehouse: 2,
        items: [{ id_clothing_size: 10, quantity: 2 }],
      });
      mock.tx.clothingSize.findUnique.mockResolvedValue({
        id: 10,
        quantity_available: 5,
        quantity_sold: 8,
      });
      mock.tx.consignmentReturn.update.mockResolvedValue({ id: 3 });

      await service.process(3);

      expect(mock.tx.clothingSize.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          quantity_available: { increment: 2 },
          quantity_sold: { decrement: 2 },
        },
      });
      // No toca consignment_stock en POST_SALE
      expect(mock.tx.consignmentStock.update).not.toHaveBeenCalled();
      expect(mock.tx.consignmentStock.delete).not.toHaveBeenCalled();
    });

    it('POST_SALE refuses if quantity_sold insufficient', async () => {
      mock.tx.consignmentReturn.findUnique.mockResolvedValue({
        id: 4,
        status: 'DRAFT',
        return_type: 'POST_SALE',
        id_warehouse: 2,
        items: [{ id_clothing_size: 10, quantity: 99 }],
      });
      mock.tx.clothingSize.findUnique.mockResolvedValue({
        id: 10,
        quantity_available: 5,
        quantity_sold: 3,
      });
      await expect(service.process(4)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
