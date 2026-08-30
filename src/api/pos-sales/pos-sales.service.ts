import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PosSalesService {
  private readonly logger = new Logger(PosSalesService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    this.logger.log('Creando venta POS borrador');
    return this.prisma.posSale.create({
      data: {
        customerName: data.customerName,
        customerDoc: data.customerDoc,
        customerDocType: data.customerDocType,
        customerEmail: data.customerEmail || null,
        customerPhone: data.customerPhone || null,
        paymentMethod: data.paymentMethod,
        subtotal: data.subtotal,
        taxTotal: data.taxTotal,
        total: data.total,
        lines: data.lines,
        status: 'PENDING',
      },
    });
  }

  async findAll() {
    return this.prisma.posSale.findMany({
      orderBy: { createdAt: 'desc' },
      include: { dianInvoice: true },
    });
  }

  async queueBatch(saleIds: number[]) {
    this.logger.log(`Encolando ${saleIds.length} ventas POS para DIAN`);
    const updated = await this.prisma.posSale.updateMany({
      where: {
        id: { in: saleIds },
        status: { in: ['PENDING', 'ERROR'] },
      },
      data: { status: 'QUEUED', dian_error_msg: null },
    });
    return { success: true, enqueued: updated.count };
  }
}
