import { Test, TestingModule } from '@nestjs/testing';
import { PosSalesService } from './pos-sales.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PosSalesService', () => {
  let service: PosSalesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    posSale: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosSalesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PosSalesService>(PosSalesService);
    prismaService = module.get<PrismaService>(PrismaService);
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a pos sale with PENDING status', async () => {
      const payload = {
        customerName: 'Juan',
        customerDoc: '123',
        customerDocType: '13',
        paymentMethod: '10',
        subtotal: 1000,
        taxTotal: 190,
        total: 1190,
        lines: [],
      };

      mockPrismaService.posSale.create.mockResolvedValueOnce({
        id: 1,
        ...payload,
        status: 'PENDING'
      });

      const result = await service.create(payload);

      expect(mockPrismaService.posSale.create).toHaveBeenCalledWith({
        data: {
          ...payload,
          customerEmail: null,
          customerPhone: null,
          status: 'PENDING',
        }
      });
      expect(result).toEqual({ id: 1, ...payload, status: 'PENDING' });
    });
  });

  describe('findAll', () => {
    it('should return all pos sales including dianInvoice', async () => {
      const mockSales = [{ id: 1, customerName: 'Juan', dianInvoice: { id: 99 } }];
      mockPrismaService.posSale.findMany.mockResolvedValueOnce(mockSales);

      const result = await service.findAll();

      expect(mockPrismaService.posSale.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: { dianInvoice: true },
      });
      expect(result).toEqual(mockSales);
    });
  });

  describe('queueBatch', () => {
    it('should update pos sales status to QUEUED', async () => {
      mockPrismaService.posSale.updateMany.mockResolvedValueOnce({ count: 2 });

      const result = await service.queueBatch([1, 2]);

      expect(mockPrismaService.posSale.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: [1, 2] },
          status: { in: ['PENDING', 'ERROR'] }
        },
        data: { status: 'QUEUED', dian_error_msg: null }
      });
      expect(result).toEqual({ success: true, enqueued: 2 });
    });
  });
});
