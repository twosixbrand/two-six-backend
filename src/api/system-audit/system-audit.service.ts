import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SystemAuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    tableName?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    const where: any = {};

    if (query.tableName) {
      where.tableName = query.tableName;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const logs = await this.prisma.systemAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 100,
    });

    // Convert BigInt to string so JSON.stringify doesn't throw Error
    return logs.map(log => ({
      ...log,
      id: log.id.toString(),
    }));
  }
}
