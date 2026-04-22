import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConsignmentWarehouseService } from './consignment-warehouse.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ConsignmentWarehouseService', () => {
  let service: ConsignmentWarehouseService;

  const mockPrisma = {
    customer: { findUnique: jest.fn() },
    consignmentWarehouse: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    consignmentStock: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsignmentWarehouseService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ConsignmentWarehouseService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates warehouse when customer is a consignment ally', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({
        id: 1,
        name: 'Retail X',
        is_consignment_ally: true,
      });
      mockPrisma.consignmentWarehouse.create.mockResolvedValue({ id: 10, id_customer: 1, name: 'Bodega A' });

      const result = await service.create({ id_customer: 1, name: 'Bodega A' });

      expect(result.id).toBe(10);
      expect(mockPrisma.consignmentWarehouse.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ id_customer: 1, name: 'Bodega A', is_active: true }),
        }),
      );
    });

    it('throws NotFound if customer does not exist', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ id_customer: 999, name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequest if customer is not consignment ally', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({
        id: 1,
        name: 'Retail X',
        is_consignment_ally: false,
      });
      await expect(
        service.create({ id_customer: 1, name: 'Bodega A' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('returns warehouse when found', async () => {
      mockPrisma.consignmentWarehouse.findUnique.mockResolvedValue({ id: 1, name: 'B1' });
      await expect(service.findOne(1)).resolves.toEqual({ id: 1, name: 'B1' });
    });

    it('throws NotFound when missing', async () => {
      mockPrisma.consignmentWarehouse.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes empty warehouse', async () => {
      mockPrisma.consignmentWarehouse.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.consignmentStock.count.mockResolvedValue(0);
      mockPrisma.consignmentWarehouse.delete.mockResolvedValue({ id: 1 });

      await service.remove(1);
      expect(mockPrisma.consignmentWarehouse.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('refuses to delete warehouse with stock', async () => {
      mockPrisma.consignmentWarehouse.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.consignmentStock.count.mockResolvedValue(3);
      await expect(service.remove(1)).rejects.toBeInstanceOf(BadRequestException);
      expect(mockPrisma.consignmentWarehouse.delete).not.toHaveBeenCalled();
    });
  });
});
