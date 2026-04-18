import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateSellReportDto {
  id_warehouse: number;
  id_customer: number;
  notes?: string;
  items: { id_clothing_size: number; quantity: number }[];
}

@Injectable()
export class ConsignmentSellReportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * El cliente crea un reporte de venta desde el portal web.
   * Solo puede reportar items que están EN_CONSIGNACION en su bodega.
   */
  async create(dto: CreateSellReportDto) {
    if (!dto.items?.length) {
      throw new BadRequestException('Agrega al menos un producto vendido.');
    }

    const warehouse = await this.prisma.consignmentWarehouse.findUnique({
      where: { id: dto.id_warehouse },
    });
    if (!warehouse) throw new NotFoundException('Bodega no encontrada.');
    if (warehouse.id_customer !== dto.id_customer) {
      throw new ForbiddenException('No tienes acceso a esta bodega.');
    }

    // Validar que cada item esté en stock EN_CONSIGNACION
    for (const item of dto.items) {
      if (!(item.quantity > 0)) {
        throw new BadRequestException('Todas las cantidades deben ser mayores a 0.');
      }
      const stock = await this.prisma.consignmentStock.findUnique({
        where: {
          id_warehouse_id_clothing_size_status: {
            id_warehouse: dto.id_warehouse,
            id_clothing_size: item.id_clothing_size,
            status: 'EN_CONSIGNACION',
          },
        },
      });
      if (!stock || stock.quantity < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para el producto #${item.id_clothing_size}. Disponible: ${stock?.quantity ?? 0}, reportado: ${item.quantity}.`,
        );
      }
    }

    return this.prisma.consignmentSellReport.create({
      data: {
        id_warehouse: dto.id_warehouse,
        id_customer: dto.id_customer,
        notes: dto.notes,
        items: {
          create: dto.items.map((it) => ({
            id_clothing_size: it.id_clothing_size,
            quantity: it.quantity,
          })),
        },
      },
      include: { items: true, warehouse: true },
    });
  }

  /**
   * El cliente ve sus reportes (solo los suyos).
   */
  findByCustomer(id_customer: number) {
    return this.prisma.consignmentSellReport.findMany({
      where: { id_customer },
      include: {
        warehouse: { select: { id: true, name: true } },
        items: {
          include: {
            clothingSize: {
              include: {
                size: true,
                clothingColor: {
                  include: {
                    color: true,
                    imageClothing: { orderBy: { position: 'asc' as const }, take: 1, select: { image_url: true } },
                    design: { select: { reference: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  /**
   * El operador CMS ve todos los reportes pendientes.
   */
  findAll(filters: { status?: string; id_customer?: number } = {}) {
    return this.prisma.consignmentSellReport.findMany({
      where: {
        ...(filters.status && { status: filters.status as any }),
        ...(filters.id_customer && { id_customer: filters.id_customer }),
      },
      include: {
        customer: { select: { id: true, name: true, document_number: true } },
        warehouse: { select: { id: true, name: true } },
        items: {
          include: {
            clothingSize: {
              include: {
                size: true,
                clothingColor: {
                  include: {
                    color: true,
                    imageClothing: { orderBy: { position: 'asc' as const }, take: 1, select: { image_url: true } },
                    design: { select: { reference: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const report = await this.prisma.consignmentSellReport.findUnique({
      where: { id },
      include: {
        customer: true,
        warehouse: true,
        items: {
          include: {
            clothingSize: {
              include: {
                size: true,
                clothingColor: {
                  include: {
                    color: true,
                    imageClothing: { orderBy: { position: 'asc' as const }, take: 1, select: { image_url: true } },
                    design: { select: { reference: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!report) throw new NotFoundException(`Reporte #${id} no encontrado.`);
    return report;
  }

  /**
   * Operador rechaza el reporte.
   */
  async reject(id: number, reason: string, rejectedBy: string) {
    const report = await this.findOne(id);
    if (report.status !== 'PENDING') {
      throw new BadRequestException(`Solo se pueden rechazar reportes PENDING (actual: ${report.status}).`);
    }
    return this.prisma.consignmentSellReport.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejected_reason: reason,
        approved_by: rejectedBy,
        approved_at: new Date(),
      },
    });
  }

  /**
   * El cliente ve su stock disponible en consignación por bodega.
   */
  async getClientStock(id_customer: number) {
    const warehouses = await this.prisma.consignmentWarehouse.findMany({
      where: { id_customer, is_active: true },
      include: {
        stocks: {
          where: { status: 'EN_CONSIGNACION', quantity: { gt: 0 } },
          include: {
            clothingSize: {
              include: {
                size: true,
                clothingColor: {
                  include: {
                    color: true,
                    imageClothing: { orderBy: { position: 'asc' as const }, take: 1, select: { image_url: true } },
                    design: { select: { reference: true, description: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    return warehouses;
  }
}
