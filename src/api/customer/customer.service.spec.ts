import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from './customer.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let prisma: PrismaService;

  const mockPrisma = {
    customer: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findAll ────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all customers with related types', async () => {
      const customers = [
        {
          id: 1,
          name: 'Alice',
          customerType: { id: 1, name: 'Natural' },
          identificationType: { id: 1 },
        },
        {
          id: 2,
          name: 'Bob',
          customerType: { id: 1, name: 'Natural' },
          identificationType: { id: 2 },
        },
      ];
      mockPrisma.customer.findMany.mockResolvedValue(customers);

      const result = await service.findAll();

      expect(result).toEqual(customers);
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith({
        include: {
          customerType: true,
          identificationType: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no customers exist', async () => {
      mockPrisma.customer.findMany.mockResolvedValue([]);

      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ─── findOne ────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      const customer = {
        id: 1,
        name: 'Alice',
        customerType: {},
        identificationType: {},
      };
      mockPrisma.customer.findUnique.mockResolvedValue(customer);

      const result = await service.findOne(1);

      expect(result).toEqual(customer);
      expect(mockPrisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          customerType: true,
          identificationType: true,
        },
      });
    });

    it('should return null when customer does not exist', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  // ─── update ─────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return the customer', async () => {
      const dto = { name: 'Alice Updated', city: 'Bogota' };
      const updated = { id: 1, ...dto };
      mockPrisma.customer.update.mockResolvedValue(updated);

      const result = await service.update(1, dto);

      expect(result).toEqual(updated);
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto,
      });
    });

    it('should propagate error when customer does not exist', async () => {
      mockPrisma.customer.update.mockRejectedValue(
        new Error('Record to update not found'),
      );

      await expect(service.update(999, { name: 'Ghost' })).rejects.toThrow(
        'Record to update not found',
      );
    });
  });
});
