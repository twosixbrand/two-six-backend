import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    action: string,
    entityType: string,
    entityId: number,
    details?: string,
    userId?: number,
    userName?: string,
    ipAddress?: string,
  ) {
    return this.prisma.accountingAuditLog.create({
      data: {
        action,
        entity_type: entityType,
        entity_id: entityId,
        user_id: userId ?? null,
        user_name: userName ?? null,
        details: details ?? null,
        ip_address: ipAddress ?? null,
      },
    });
  }

  async findAll(query: {
    entityType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    const where: any = {};

    if (query.entityType) {
      where.entity_type = query.entityType;
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

    return this.prisma.accountingAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 50,
    });
  }
}
