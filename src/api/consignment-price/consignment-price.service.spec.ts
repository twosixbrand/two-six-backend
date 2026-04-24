import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConsignmentPriceService } from './consignment-price.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ConsignmentPriceService', () => {
  let service: ConsignmentPriceService;

  const tx = {
    customerConsignmentPrice: {
      create: jest.fn(),
    },
  };
  const mockPrisma: any = {
    customer: { findUnique: jest.fn() },
    product: { findUnique: jest.fn(), findMany: jest.fn() },
    customerConsignmentPrice: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((cb: any) => cb(tx)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsignmentPriceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ConsignmentPriceService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const allyCustomer = { id: 1, name: 'Ally', is_consignment_ally: true };
    const product = { id: 5, price: 50000 };

    it('creates price with default valid_from=now when not provided', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(allyCustomer);
      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.customerConsignmentPrice.create.mockResolvedValue({ id: 1 });

      await service.create({ id_customer: 1, id_product: 5, price: 42000 });

      expect(mockPrisma.customerConsignmentPrice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id_customer: 1,
          id_product: 5,
          price: 42000,
          valid_to: null,
        }),
      });
    });

    it('rejects non-ally customers', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({
        ...allyCustomer,
        is_consignment_ally: false,
      });
      await expect(
        service.create({ id_customer: 1, id_product: 5, price: 100 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects non-positive prices', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(allyCustomer);
      mockPrisma.product.findUnique.mockResolvedValue(product);
      await expect(
        service.create({ id_customer: 1, id_product: 5, price: 0 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFound when product missing', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(allyCustomer);
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ id_customer: 1, id_product: 999, price: 100 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getEffectivePrice', () => {
    it('returns the latest active price for customer+product', async () => {
      const row = {
        id: 1,
        price: 40000,
        valid_from: new Date('2026-01-01'),
        valid_to: null,
      };
      mockPrisma.customerConsignmentPrice.findFirst.mockResolvedValue(row);

      const result = await service.getEffectivePrice(1, 5);

      expect(result).toEqual(row);
      expect(
        mockPrisma.customerConsignmentPrice.findFirst,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id_customer: 1,
            id_product: 5,
          }),
          orderBy: { valid_from: 'desc' },
        }),
      );
    });

    it('returns null when no active price exists', async () => {
      mockPrisma.customerConsignmentPrice.findFirst.mockResolvedValue(null);
      const result = await service.getEffectivePrice(1, 5);
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('rejects negative price on update', async () => {
      mockPrisma.customerConsignmentPrice.findUnique.mockResolvedValue({
        id: 1,
      });
      await expect(service.update(1, { price: -1 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('bulkCreate', () => {
    const ally = { id: 1, name: 'Ally', is_consignment_ally: true };

    it('rechaza lista vacía de productos', async () => {
      await expect(
        service.bulkCreate({ id_customer: 1, id_products: [], price: 50000 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza precio inválido', async () => {
      await expect(
        service.bulkCreate({ id_customer: 1, id_products: [5], price: 0 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza cliente no aliado', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({
        ...ally,
        is_consignment_ally: false,
      });
      await expect(
        service.bulkCreate({ id_customer: 1, id_products: [5], price: 50000 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza cuando algún producto no existe', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(ally);
      mockPrisma.product.findMany.mockResolvedValue([{ id: 5 }]); // falta 99
      await expect(
        service.bulkCreate({
          id_customer: 1,
          id_products: [5, 99],
          price: 50000,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('crea precios atómicamente para todos los productos', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(ally);
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 5 },
        { id: 6 },
        { id: 7 },
      ]);
      tx.customerConsignmentPrice.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: Math.random(), ...data }),
      );

      const result = await service.bulkCreate({
        id_customer: 1,
        id_products: [5, 6, 7, 5], // duplicado debe deduparse
        price: 42000,
        valid_from: '2026-04-15T00:00:00Z',
      });

      expect(result.created_count).toBe(3);
      expect(tx.customerConsignmentPrice.create).toHaveBeenCalledTimes(3);
      expect(tx.customerConsignmentPrice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ id_customer: 1, price: 42000 }),
        }),
      );
    });
  });
});
