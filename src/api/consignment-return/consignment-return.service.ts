import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JournalAutoService } from '../accounting/journal/journal-auto.service';

export interface CreateReturnDto {
  id_warehouse: number;
  return_type: 'PORTFOLIO' | 'WARRANTY' | 'POST_SALE';
  id_order?: number;
  notes?: string;
  items: {
    id_clothing_size: number;
    quantity: number;
    unit_price?: number;
    reason?: string;
  }[];
}

@Injectable()
export class ConsignmentReturnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journalAutoService: JournalAutoService,
  ) {}

  async create(data: CreateReturnDto) {
    if (!data.items?.length) {
      throw new BadRequestException('La devolución debe tener al menos 1 ítem.');
    }
    for (const it of data.items) {
      if (!(it.quantity > 0)) {
        throw new BadRequestException('Las cantidades deben ser mayores a 0.');
      }
    }

    const warehouse = await this.prisma.consignmentWarehouse.findUnique({
      where: { id: data.id_warehouse },
    });
    if (!warehouse) throw new NotFoundException('Bodega no encontrada.');

    if (data.return_type === 'POST_SALE') {
      if (!data.id_order) {
        throw new BadRequestException(
          'Las devoluciones post-venta requieren la orden original (id_order).',
        );
      }
      const order = await this.prisma.order.findUnique({
        where: { id: data.id_order },
      });
      if (!order) throw new NotFoundException(`Orden #${data.id_order} no encontrada.`);
      if (order.id_customer !== warehouse.id_customer) {
        throw new BadRequestException('La orden no pertenece al cliente de esta bodega.');
      }
      for (const it of data.items) {
        if (!(it.unit_price && it.unit_price > 0)) {
          throw new BadRequestException(
            'Las devoluciones post-venta requieren unit_price en cada ítem (para la nota crédito).',
          );
        }
      }
    }

    return this.prisma.consignmentReturn.create({
      data: {
        id_warehouse: data.id_warehouse,
        return_type: data.return_type,
        id_order: data.id_order ?? null,
        notes: data.notes,
        items: {
          create: data.items.map((it) => ({
            id_clothing_size: it.id_clothing_size,
            quantity: it.quantity,
            unit_price: it.unit_price ?? null,
            reason: it.reason ?? null,
          })),
        },
      },
      include: {
        items: true,
        warehouse: { include: { customer: true } },
        order: true,
      },
    });
  }

  findAll(filters: { id_warehouse?: number; return_type?: string; status?: string } = {}) {
    return this.prisma.consignmentReturn.findMany({
      where: {
        ...(filters.id_warehouse && { id_warehouse: filters.id_warehouse }),
        ...(filters.return_type && { return_type: filters.return_type as any }),
        ...(filters.status && { status: filters.status as any }),
      },
      include: {
        warehouse: { include: { customer: { select: { id: true, name: true } } } },
        items: true,
        order: { select: { id: true, order_reference: true } },
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const r = await this.prisma.consignmentReturn.findUnique({
      where: { id },
      include: {
        warehouse: { include: { customer: true } },
        order: true,
        items: {
          include: {
            clothingSize: {
              include: {
                size: true,
                clothingColor: {
                  include: {
                    color: true,
                    design: { select: { id: true, reference: true, description: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!r) throw new NotFoundException(`Devolución #${id} no encontrada.`);
    return r;
  }

  async process(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const ret = await tx.consignmentReturn.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!ret) throw new NotFoundException(`Devolución #${id} no encontrada.`);
      if (ret.status !== 'DRAFT') {
        throw new ConflictException(
          `Solo se pueden procesar devoluciones en estado DRAFT (actual: ${ret.status}).`,
        );
      }

      for (const item of ret.items) {
        const size = await tx.clothingSize.findUnique({
          where: { id: item.id_clothing_size },
        });
        if (!size) {
          throw new NotFoundException(
            `ClothingSize #${item.id_clothing_size} no encontrado.`,
          );
        }

        if (ret.return_type === 'PORTFOLIO' || ret.return_type === 'WARRANTY') {
          // Estos tipos descuentan del bucket EN_CONSIGNACION del warehouse
          const active = await tx.consignmentStock.findUnique({
            where: {
              id_warehouse_id_clothing_size_status: {
                id_warehouse: ret.id_warehouse,
                id_clothing_size: item.id_clothing_size,
                status: 'EN_CONSIGNACION',
              },
            },
          });
          if (!active || active.quantity < item.quantity) {
            throw new BadRequestException(
              `Stock en consignación insuficiente para el ítem ${item.id_clothing_size}. Disponible: ${active?.quantity ?? 0}, requerido: ${item.quantity}.`,
            );
          }
          if (active.quantity === item.quantity) {
            await tx.consignmentStock.delete({ where: { id: active.id } });
          } else {
            await tx.consignmentStock.update({
              where: { id: active.id },
              data: { quantity: { decrement: item.quantity } },
            });
          }
        }

        if (ret.return_type === 'PORTFOLIO') {
          // Vuelve al stock disponible de Two Six
          await tx.clothingSize.update({
            where: { id: item.id_clothing_size },
            data: {
              quantity_available: { increment: item.quantity },
              quantity_on_consignment: { decrement: item.quantity },
            },
          });
          await tx.inventoryKardex.create({
            data: {
              id_clothing_size: item.id_clothing_size,
              type: 'IN',
              source_type: 'CONSIGNMENT_RETURN_PORTFOLIO',
              source_id: ret.id,
              quantity: item.quantity,
              balance_before: size.quantity_available,
              balance_after: size.quantity_available + item.quantity,
              description: `Devolución portafolio consignación #${ret.id}`,
            },
          });
        } else if (ret.return_type === 'WARRANTY') {
          // Marca como garantía, no vuelve a disponible
          await tx.clothingSize.update({
            where: { id: item.id_clothing_size },
            data: {
              quantity_under_warranty: { increment: item.quantity },
              quantity_on_consignment: { decrement: item.quantity },
            },
          });
          await tx.inventoryKardex.create({
            data: {
              id_clothing_size: item.id_clothing_size,
              type: 'OUT',
              source_type: 'CONSIGNMENT_RETURN_WARRANTY',
              source_id: ret.id,
              quantity: item.quantity,
              balance_before: size.quantity_available,
              balance_after: size.quantity_available,
              description: `Garantía consignación #${ret.id}`,
            },
          });
        } else if (ret.return_type === 'POST_SALE') {
          // Post-venta: los ítems ya NO están en consignment_stock (se vendieron).
          // Vuelven al disponible y se decrementa quantity_sold. La nota crédito DIAN
          // se dispara luego desde el CMS usando el endpoint existente.
          if (size.quantity_sold < item.quantity) {
            throw new BadRequestException(
              `No se pueden devolver ${item.quantity} unidades de un producto que solo registra ${size.quantity_sold} vendidas.`,
            );
          }
          await tx.clothingSize.update({
            where: { id: item.id_clothing_size },
            data: {
              quantity_available: { increment: item.quantity },
              quantity_sold: { decrement: item.quantity },
            },
          });
          await tx.inventoryKardex.create({
            data: {
              id_clothing_size: item.id_clothing_size,
              type: 'IN',
              source_type: 'CONSIGNMENT_RETURN_POST_SALE',
              source_id: ret.id,
              quantity: item.quantity,
              balance_before: size.quantity_available,
              balance_after: size.quantity_available + item.quantity,
              description: `Devolución post-venta consignación #${ret.id}`,
            },
          });
        }
      }

      return tx.consignmentReturn.update({
        where: { id },
        data: { status: 'PROCESSED', processed_at: new Date() },
        include: {
          items: true,
          warehouse: { include: { customer: true } },
          order: { include: { dianEInvoicings: true } },
        },
      });
    }).then(async (result) => {
      // Asiento contable según tipo. Best-effort, no bloquea.
      try {
        if (result.return_type === 'PORTFOLIO') {
          await this.journalAutoService.onConsignmentReturnPortfolio(result.id);
        } else if (result.return_type === 'WARRANTY') {
          await this.journalAutoService.onConsignmentReturnWarranty(result.id);
        } else if (result.return_type === 'POST_SALE') {
          await this.journalAutoService.onConsignmentReturnPostSale(result.id);
        }
      } catch (err: any) {
        console.error(
          `[JournalAuto] Error generando asiento de devolución ${result.id}: ${err.message}`,
        );
      }
      return result;
    });
  }

  async cancel(id: number) {
    const r = await this.findOne(id);
    if (r.status !== 'DRAFT') {
      throw new ConflictException(
        `Solo se pueden cancelar devoluciones en DRAFT (actual: ${r.status}).`,
      );
    }
    return this.prisma.consignmentReturn.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async remove(id: number) {
    const r = await this.findOne(id);
    if (r.status === 'PROCESSED') {
      throw new ConflictException(
        'No se puede eliminar una devolución procesada. Usa el flujo de ajuste inverso.',
      );
    }
    return this.prisma.consignmentReturn.delete({ where: { id } });
  }

  /** Registra el id de la nota crédito DIAN generada post-procesamiento. */
  async attachCreditNote(id: number, credit_note_id: number) {
    return this.prisma.consignmentReturn.update({
      where: { id },
      data: { credit_note_id },
    });
  }
}
