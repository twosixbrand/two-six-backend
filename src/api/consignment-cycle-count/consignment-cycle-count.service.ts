import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConsignmentPriceService } from '../consignment-price/consignment-price.service';
import { JournalAutoService } from '../accounting/journal/journal-auto.service';

export interface CreateCycleCountDto {
  id_warehouse: number;
  notes?: string;
}

export interface SaveCycleCountItemsDto {
  items: { id: number; real_qty: number | null }[];
}

export interface CreateMermaInvoiceDto {
  price_mode: 'CONSIGNMENT' | 'PENALTY';
  penalty_unit_price?: number; // precio unitario único aplicado a todos los faltantes (modo PENALTY)
  notes?: string;
}

const IVA_RATE = 0.19;

@Injectable()
export class ConsignmentCycleCountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priceService: ConsignmentPriceService,
    private readonly journalAutoService: JournalAutoService,
  ) {}

  /**
   * Crea un conteo cíclico con snapshot de ConsignmentStock EN_CONSIGNACION
   * en la bodega destino. Los items quedan con real_qty NULL para que el operador
   * los capture.
   */
  async create(dto: CreateCycleCountDto) {
    const warehouse = await this.prisma.consignmentWarehouse.findUnique({
      where: { id: dto.id_warehouse },
    });
    if (!warehouse) throw new NotFoundException('Bodega no encontrada.');

    const stocks = await this.prisma.consignmentStock.findMany({
      where: {
        id_warehouse: dto.id_warehouse,
        status: 'EN_CONSIGNACION',
        quantity: { gt: 0 },
      },
    });

    if (stocks.length === 0) {
      throw new BadRequestException(
        'La bodega no tiene stock en consignación para conciliar.',
      );
    }

    return this.prisma.inventoryCycleCount.create({
      data: {
        id_warehouse: dto.id_warehouse,
        notes: dto.notes,
        items: {
          create: stocks.map((s) => ({
            id_clothing_size: s.id_clothing_size,
            theoretical_qty: s.quantity,
            real_qty: null,
          })),
        },
      },
      include: {
        items: true,
        warehouse: { include: { customer: true } },
      },
    });
  }

  findAll(filters: { id_warehouse?: number; status?: string } = {}) {
    return this.prisma.inventoryCycleCount.findMany({
      where: {
        ...(filters.id_warehouse && { id_warehouse: filters.id_warehouse }),
        ...(filters.status && { status: filters.status as any }),
      },
      include: {
        warehouse: { include: { customer: { select: { id: true, name: true } } } },
        items: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const cc = await this.prisma.inventoryCycleCount.findUnique({
      where: { id },
      include: {
        warehouse: { include: { customer: true } },
        items: {
          include: {
            clothingSize: {
              include: {
                size: true,
                clothingColor: {
                  include: {
                    color: true,
                    imageClothing: { orderBy: { position: "asc" as const }, take: 1, select: { image_url: true } },
                    design: { select: { id: true, reference: true, description: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!cc) throw new NotFoundException(`Conteo #${id} no encontrado.`);
    return cc;
  }

  /** Actualiza real_qty en los ítems del conteo (solo en DRAFT). */
  async saveItems(id: number, dto: SaveCycleCountItemsDto) {
    const cc = await this.prisma.inventoryCycleCount.findUnique({ where: { id } });
    if (!cc) throw new NotFoundException(`Conteo #${id} no encontrado.`);
    if (cc.status !== 'DRAFT') {
      throw new ConflictException('Solo se pueden editar conteos en DRAFT.');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const it of dto.items) {
        if (it.real_qty !== null && !(it.real_qty >= 0)) {
          throw new BadRequestException('real_qty debe ser >= 0 o null.');
        }
        await tx.inventoryCycleCountItem.update({
          where: { id: it.id },
          data: { real_qty: it.real_qty },
        });
      }
      return tx.inventoryCycleCount.findUnique({
        where: { id },
        include: { items: true },
      });
    });
  }

  /**
   * Aprueba el conteo y aplica los ajustes de stock.
   * - Faltantes (real < teórico): ConsignmentStock ↓, ClothingSize.quantity_on_consignment ↓, Kardex OUT
   * - Sobrantes (real > teórico): ConsignmentStock ↑, ClothingSize.quantity_on_consignment ↑, Kardex IN
   */
  async approve(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const cc = await tx.inventoryCycleCount.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!cc) throw new NotFoundException(`Conteo #${id} no encontrado.`);
      if (cc.status !== 'DRAFT') {
        throw new ConflictException(
          `Solo se pueden aprobar conteos en DRAFT (actual: ${cc.status}).`,
        );
      }

      // Validar que TODOS los ítems tengan real_qty
      const missing = cc.items.filter((it) => it.real_qty === null);
      if (missing.length > 0) {
        throw new BadRequestException(
          `Hay ${missing.length} ítems sin conteo físico. Completa real_qty en todos los ítems antes de aprobar.`,
        );
      }

      for (const item of cc.items) {
        const diff = (item.real_qty ?? 0) - item.theoretical_qty;
        if (diff === 0) continue;

        const absDiff = Math.abs(diff);
        const size = await tx.clothingSize.findUnique({
          where: { id: item.id_clothing_size },
        });
        if (!size) continue;

        // Localiza el ConsignmentStock EN_CONSIGNACION
        const stock = await tx.consignmentStock.findUnique({
          where: {
            id_warehouse_id_clothing_size_status: {
              id_warehouse: cc.id_warehouse,
              id_clothing_size: item.id_clothing_size,
              status: 'EN_CONSIGNACION',
            },
          },
        });

        if (diff < 0) {
          // Faltante: descuenta del stock en consignación
          if (!stock || stock.quantity < absDiff) {
            throw new BadRequestException(
              `Stock en consignación insuficiente para aplicar faltante del ítem #${item.id_clothing_size}.`,
            );
          }
          if (stock.quantity === absDiff) {
            await tx.consignmentStock.delete({ where: { id: stock.id } });
          } else {
            await tx.consignmentStock.update({
              where: { id: stock.id },
              data: { quantity: { decrement: absDiff } },
            });
          }
          await tx.clothingSize.update({
            where: { id: item.id_clothing_size },
            data: { quantity_on_consignment: { decrement: absDiff } },
          });
          await tx.inventoryKardex.create({
            data: {
              id_clothing_size: item.id_clothing_size,
              type: 'OUT',
              source_type: 'CYCLE_COUNT_SHORTAGE',
              source_id: cc.id,
              quantity: absDiff,
              balance_before: size.quantity_available,
              balance_after: size.quantity_available,
              description: `Faltante conteo cíclico #${cc.id}`,
            },
          });
        } else {
          // Sobrante: incrementa el stock en consignación
          if (stock) {
            await tx.consignmentStock.update({
              where: { id: stock.id },
              data: { quantity: { increment: absDiff } },
            });
          } else {
            await tx.consignmentStock.create({
              data: {
                id_warehouse: cc.id_warehouse,
                id_clothing_size: item.id_clothing_size,
                quantity: absDiff,
                status: 'EN_CONSIGNACION',
              },
            });
          }
          await tx.clothingSize.update({
            where: { id: item.id_clothing_size },
            data: { quantity_on_consignment: { increment: absDiff } },
          });
          await tx.inventoryKardex.create({
            data: {
              id_clothing_size: item.id_clothing_size,
              type: 'IN',
              source_type: 'CYCLE_COUNT_SURPLUS',
              source_id: cc.id,
              quantity: absDiff,
              balance_before: size.quantity_available,
              balance_after: size.quantity_available,
              description: `Sobrante conteo cíclico #${cc.id}`,
            },
          });
        }
      }

      return tx.inventoryCycleCount.update({
        where: { id },
        data: { status: 'APPROVED', approved_at: new Date() },
        include: {
          items: true,
          warehouse: { include: { customer: true } },
        },
      });
    }).then(async (result) => {
      // Asientos contables para faltantes y sobrantes. Best-effort, no bloquean.
      try {
        await this.journalAutoService.onCycleCountShortage(result.id);
      } catch (err: any) {
        console.error(
          `[JournalAuto] Error generando asiento faltante conteo ${result.id}: ${err.message}`,
        );
      }
      try {
        await this.journalAutoService.onCycleCountSurplus(result.id);
      } catch (err: any) {
        console.error(
          `[JournalAuto] Error generando asiento sobrante conteo ${result.id}: ${err.message}`,
        );
      }
      return result;
    });
  }

  async cancel(id: number) {
    const cc = await this.findOne(id);
    if (cc.status !== 'DRAFT') {
      throw new ConflictException('Solo se pueden cancelar conteos en DRAFT.');
    }
    return this.prisma.inventoryCycleCount.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Crea una factura de merma sobre los ítems faltantes de un conteo aprobado.
   * Devuelve el Order; el CMS luego dispara el DIAN sobre esa orden.
   */
  async createMermaInvoice(id: number, dto: CreateMermaInvoiceDto) {
    const cc = await this.prisma.inventoryCycleCount.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            clothingSize: {
              include: {
                size: true,
                clothingColor: {
                  include: {
                    color: true,
                    imageClothing: { orderBy: { position: "asc" as const }, take: 1, select: { image_url: true } },
                    design: { select: { id: true, reference: true } },
                  },
                },
                product: true,
              },
            },
          },
        },
        warehouse: { include: { customer: true } },
      },
    });
    if (!cc) throw new NotFoundException(`Conteo #${id} no encontrado.`);
    if (cc.status !== 'APPROVED') {
      throw new ConflictException('Solo se puede facturar merma de conteos APROBADOS.');
    }
    if (cc.merma_order_id) {
      throw new ConflictException(
        `Este conteo ya fue facturado (orden id=${cc.merma_order_id}).`,
      );
    }

    // Detectar faltantes
    const shortages = cc.items
      .filter((it) => (it.real_qty ?? 0) < it.theoretical_qty)
      .map((it) => ({
        item: it,
        missing: it.theoretical_qty - (it.real_qty ?? 0),
      }));

    if (shortages.length === 0) {
      throw new BadRequestException('No hay faltantes para facturar en este conteo.');
    }

    if (dto.price_mode === 'PENALTY' && !(dto.penalty_unit_price && dto.penalty_unit_price > 0)) {
      throw new BadRequestException('Modo PENALTY requiere penalty_unit_price > 0.');
    }

    // Resolver precio por ítem
    const resolvedLines: {
      product: any;
      quantity: number;
      unit_price: number;
    }[] = [];

    for (const s of shortages) {
      const product = s.item.clothingSize.product;
      if (!product) {
        throw new BadRequestException(
          `El ClothingSize #${s.item.id_clothing_size} no tiene Product asociado — no se puede facturar merma.`,
        );
      }

      let unit_price: number;
      if (dto.price_mode === 'PENALTY') {
        unit_price = dto.penalty_unit_price!;
      } else {
        const consignmentPrice = await this.priceService.getEffectivePrice(
          cc.warehouse.id_customer,
          product.id,
        );
        unit_price = consignmentPrice?.price ?? product.price;
      }

      resolvedLines.push({ product, quantity: s.missing, unit_price });
    }

    const subtotal = resolvedLines.reduce((sum, l) => sum + l.unit_price * l.quantity, 0);
    const iva = Number((subtotal * IVA_RATE).toFixed(2));
    const total = Number((subtotal + iva).toFixed(2));

    return this.prisma.$transaction(async (tx) => {
      const orderReference = `MERMA-${Date.now()}`;

      const order = await tx.order.create({
        data: {
          id_customer: cc.warehouse.id_customer,
          order_date: new Date(),
          purchase_date: new Date(),
          status: 'MERMA',
          is_paid: false, // CxC: el aliado paga después
          shipping_address: cc.warehouse.address ?? `${cc.warehouse.name} (Merma Consignación)`,
          shipping_cost: 0,
          iva,
          total_payment: total,
          payment_method: 'CONSIGNMENT_MERMA',
          delivery_method: 'CONSIGNMENT',
          order_reference: orderReference,
          discount_amount: 0,
          cod_amount: 0,
        },
      });

      for (const line of resolvedLines) {
        const p = line.product;
        const clothingSize = cc.items.find((it) => it.id_clothing_size === p.id_clothing_size)!.clothingSize;
        await tx.orderItem.create({
          data: {
            id_order: order.id,
            id_product: p.id,
            product_name: `MERMA ${clothingSize.clothingColor.design.reference} ${clothingSize.clothingColor.color.name} ${clothingSize.size.name}`,
            size: clothingSize.size.name,
            color: clothingSize.clothingColor.color.name,
            quantity: line.quantity,
            unit_price: line.unit_price,
            iva_item: Number((line.unit_price * IVA_RATE).toFixed(2)),
          },
        });
      }

      await tx.inventoryCycleCount.update({
        where: { id },
        data: {
          merma_order_id: order.id,
          notes: dto.notes ? `${cc.notes ? cc.notes + ' | ' : ''}${dto.notes}` : cc.notes,
        },
      });

      return tx.order.findUnique({
        where: { id: order.id },
        include: { orderItems: true, customer: true },
      });
    }).then(async (createdOrder) => {
      if (!createdOrder) return createdOrder;
      // Asiento contable: factura de merma (otros ingresos) + COGS. Best-effort, no bloquea.
      try {
        await this.journalAutoService.onConsignmentMermaCompleted(createdOrder.id);
      } catch (err: any) {
        console.error(
          `[JournalAuto] Error generando asiento merma orden ${createdOrder.id}: ${err.message}`,
        );
      }
      try {
        await this.journalAutoService.onCostOfGoodsSold(createdOrder.id);
      } catch (err: any) {
        console.error(
          `[JournalAuto] Error generando asiento COGS orden ${createdOrder.id}: ${err.message}`,
        );
      }
      return createdOrder;
    });
  }
}
