import { Test, TestingModule } from '@nestjs/testing';
import { SystemAuditService } from './system-audit.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SystemAuditService', () => {
  let service: SystemAuditService;
  let prisma: PrismaService;

  const mockPrisma = {
    systemAuditLog: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemAuditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SystemAuditService>(SystemAuditService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should call findMany with correct filters', async () => {
      const mockLogs = [
        { id: BigInt(1), tableName: 'order', action: 'UPDATE', createdAt: new Date() },
        { id: BigInt(2), tableName: 'order', action: 'CREATE', createdAt: new Date() },
      ];
      mockPrisma.systemAuditLog.findMany.mockResolvedValue(mockLogs);

      const query = {
        tableName: 'order',
        action: 'UPDATE',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        limit: 10,
      };

      const result = await service.findAll(query);

      expect(mockPrisma.systemAuditLog.findMany).toHaveBeenCalledWith({
        where: {
          tableName: 'order',
          action: 'UPDATE',
          createdAt: {
            gte: new Date(query.startDate),
            lte: new Date(query.endDate),
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('should use default limit if not provided', async () => {
      mockPrisma.systemAuditLog.findMany.mockResolvedValue([]);

      await service.findAll({});

      expect(mockPrisma.systemAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });

    it('should handle missing date filters', async () => {
        mockPrisma.systemAuditLog.findMany.mockResolvedValue([]);
  
        await service.findAll({ tableName: 'product' });
  
        expect(mockPrisma.systemAuditLog.findMany).toHaveBeenCalledWith({
          where: {
            tableName: 'product',
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        });
      });
  });
});
