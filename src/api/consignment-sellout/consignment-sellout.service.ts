import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConsignmentPriceService } from '../consignment-price/consignment-price.service';
import { JournalAutoService } from '../accounting/journal/journal-auto.service';

export interface SelloutRow {
  sku?: string;
  reference?: string;
  color?: string;
  size?: string;
  quantity: number;
  price_override?: number; // opcional: precio override en el CSV
}

export interface PreviewDto {
  id_customer: number;
  id_warehouse: number;
  rows: SelloutRow[];
}

export interface ProcessDto extends PreviewDto {
  notes?: string;
}

export interface ResolvedRow {
  row: SelloutRow;
  status: 'ok' | 'error';
  message?: string;
  product?: {
    id: number;
    id_clothing_size: number;
    reference: string;
    color: string;
    size: string;
    base_price: number;
  };
  effective_price?: number;
  available_in_warehouse?: number;
  line_total?: number;
}

const IVA_RATE = 0.19;

@Injectable()
export class ConsignmentSelloutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priceService: ConsignmentPriceService,
    private readonly journalAutoService: JournalAutoService,
  ) {}

  /** Busca un producto por SKU (si viene) o por compound reference+color+size. */
  private async resolveProduct(row: SelloutRow): Promise<any | null> {
    if (row.sku) {
      const p = await this.prisma.product.findFirst({
        where: { sku: row.sku },
        include: {
          clothingSize: {
            include: {
              size: true,
              clothingColor: {
                include: {
                  color: true,
                  imageClothing: {
                    orderBy: { position: 'asc' as const },
                    take: 1,
                    select: { image_url: true },
                  },
                  design: { select: { id: true, reference: true } },
                },
              },
            },
          },
        },
      });
      if (p) return p;
    }

    if (row.reference && row.color && row.size) {
      return this.prisma.product.findFirst({
        where: {
          clothingSize: {
            size: { name: row.size },
            clothingColor: {
              color: { name: row.color },
              design: { reference: row.reference },
            },
          },
        },
        include: {
          clothingSize: {
            include: {
              size: true,
              clothingColor: {
                include: {
                  color: true,
                  imageClothing: {
                    orderBy: { position: 'asc' as const },
                    take: 1,
                    select: { image_url: true },
                  },
                  design: { select: { id: true, reference: true } },
                },
              },
            },
          },
        },
      });
    }

    return null;
  }

  async preview(dto: PreviewDto): Promise<{
    customer: { id: number; name: string };
    warehouse: { id: number; name: string };
    resolved: ResolvedRow[];
    summary: {
      ok_count: number;
      error_count: number;
      subtotal: number;
      iva: number;
      total: number;
    };
  }> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.id_customer },
      select: { id: true, name: true, is_consignment_ally: true },
    });
    if (!customer)
      throw new NotFoundException(`Cliente #${dto.id_customer} no encontrado.`);
    if (!customer.is_consignment_ally) {
      throw new BadRequestException('El cliente no es aliado de consignación.');
    }

    const warehouse = await this.prisma.consignmentWarehouse.findUnique({
      where: { id: dto.id_warehouse },
    });
    if (!warehouse) throw new NotFoundException('Bodega no encontrada.');
    if (warehouse.id_customer !== dto.id_customer) {
      throw new BadRequestException(
        'La bodega no pertenece al cliente indicado.',
      );
    }

    if (!dto.rows?.length) {
      throw new BadRequestException('No hay filas para procesar.');
    }

    const resolved: ResolvedRow[] = [];

    for (const row of dto.rows) {
      if (!(row.quantity > 0)) {
        resolved.push({ row, status: 'error', message: 'Cantidad inválida.' });
        continue;
      }

      const product = await this.resolveProduct(row);
      if (!product) {
        resolved.push({
          row,
          status: 'error',
          message: `Producto no encontrado (sku=${row.sku || '-'}, ref=${row.reference || '-'}/${row.color || '-'}/${row.size || '-'}).`,
        });
        continue;
      }

      // Stock disponible en la bodega (EN_CONSIGNACION)
      const stock = await this.prisma.consignmentStock.findUnique({
        where: {
          id_warehouse_id_clothing_size_status: {
            id_warehouse: dto.id_warehouse,
            id_clothing_size: product.id_clothing_size,
            status: 'EN_CONSIGNACION',
          },
        },
      });
      const available = stock?.quantity ?? 0;
      if (available < row.quantity) {
        resolved.push({
          row,
          status: 'error',
          message: `Stock insuficiente en la bodega. Disponible: ${available}, requerido: ${row.quantity}.`,
          product: this.productSummary(product),
          available_in_warehouse: available,
        });
        continue;
      }

      // Precio efectivo: override > consignación vigente > base
      let effective_price: number;
      if (row.price_override && row.price_override > 0) {
        effective_price = row.price_override;
      } else {
        const consignmentPrice = await this.priceService.getEffectivePrice(
          dto.id_customer,
          product.id,
        );
        effective_price = consignmentPrice?.price ?? product.price;
      }

      const line_total = effective_price * row.quantity;
      resolved.push({
        row,
        status: 'ok',
        product: this.productSummary(product),
        effective_price,
        available_in_warehouse: available,
        line_total,
      });
    }

    const ok_rows = resolved.filter((r) => r.status === 'ok');
    const subtotal = ok_rows.reduce((s, r) => s + (r.line_total ?? 0), 0);
    // El subtotal del sell-out se asume precio neto; IVA se suma al total.
    const iva = Number((subtotal * IVA_RATE).toFixed(2));
    const total = Number((subtotal + iva).toFixed(2));

    return {
      customer: { id: customer.id, name: customer.name },
      warehouse: { id: warehouse.id, name: warehouse.name },
      resolved,
      summary: {
        ok_count: ok_rows.length,
        error_count: resolved.length - ok_rows.length,
        subtotal: Number(subtotal.toFixed(2)),
        iva,
        total,
      },
    };
  }

  private productSummary(p: any) {
    return {
      id: p.id,
      id_clothing_size: p.id_clothing_size,
      reference: p.clothingSize?.clothingColor?.design?.reference,
      color: p.clothingSize?.clothingColor?.color?.name,
      size: p.clothingSize?.size?.name,
      base_price: p.price,
    };
  }

  async process(dto: ProcessDto) {
    const preview = await this.preview(dto);
    if (preview.summary.error_count > 0) {
      throw new BadRequestException(
        `El reporte tiene ${preview.summary.error_count} filas con error. Corrígelas antes de procesar.`,
      );
    }
    if (preview.summary.ok_count === 0) {
      throw new BadRequestException('No hay filas válidas para procesar.');
    }

    const okRows = preview.resolved.filter((r) => r.status === 'ok');

    return this.prisma
      .$transaction(async (tx) => {
        const warehouse = await tx.consignmentWarehouse.findUnique({
          where: { id: dto.id_warehouse },
          include: { customer: true },
        });
        if (!warehouse) throw new NotFoundException('Bodega no encontrada.');

        // Genera referencia única para la orden
        const orderReference = `SO-${Date.now()}`;

        const order = await tx.order.create({
          data: {
            id_customer: dto.id_customer,
            order_date: new Date(),
            purchase_date: new Date(),
            status: 'SELLOUT',
            is_paid: false, // CxC: el aliado paga después
            shipping_address:
              warehouse.address ?? `${warehouse.name} (Sell-out Consignación)`,
            shipping_cost: 0,
            iva: preview.summary.iva,
            total_payment: preview.summary.total,
            payment_method: 'CONSIGNMENT_SELLOUT',
            delivery_method: 'CONSIGNMENT',
            order_reference: orderReference,
            discount_amount: 0,
            cod_amount: 0,
          },
        });

        for (const r of okRows) {
          const p = r.product!;
          const unitPrice = r.effective_price!;
          const qty = r.row.quantity;

          // Crea OrderItem
          await tx.orderItem.create({
            data: {
              id_order: order.id,
              id_product: p.id,
              product_name: `${p.reference} ${p.color} ${p.size}`,
              size: p.size,
              color: p.color,
              quantity: qty,
              unit_price: unitPrice,
              iva_item: Number((unitPrice * IVA_RATE).toFixed(2)),
            },
          });

          // Descuenta ConsignmentStock EN_CONSIGNACION
          const stock = await tx.consignmentStock.findUnique({
            where: {
              id_warehouse_id_clothing_size_status: {
                id_warehouse: dto.id_warehouse,
                id_clothing_size: p.id_clothing_size,
                status: 'EN_CONSIGNACION',
              },
            },
          });
          if (!stock || stock.quantity < qty) {
            throw new BadRequestException(
              `Stock insuficiente durante el procesamiento para ${p.reference} ${p.color} ${p.size}.`,
            );
          }
          if (stock.quantity === qty) {
            await tx.consignmentStock.delete({ where: { id: stock.id } });
          } else {
            await tx.consignmentStock.update({
              where: { id: stock.id },
              data: { quantity: { decrement: qty } },
            });
          }

          // Actualiza caches en ClothingSize
          const size = await tx.clothingSize.findUnique({
            where: { id: p.id_clothing_size },
          });
          if (!size) continue;

          await tx.clothingSize.update({
            where: { id: p.id_clothing_size },
            data: {
              quantity_on_consignment: { decrement: qty },
              quantity_sold: { increment: qty },
            },
          });

          // Kardex (ya estaba OUT al enviar; esto registra la venta real)
          await tx.inventoryKardex.create({
            data: {
              id_clothing_size: p.id_clothing_size,
              type: 'OUT',
              source_type: 'CONSIGNMENT_SELLOUT',
              source_id: order.id,
              quantity: qty,
              balance_before: size.quantity_available, // disponible no cambia en sell-out
              balance_after: size.quantity_available,
              unit_cost: null,
              description: `Sell-out orden ${orderReference}`,
            },
          });
        }

        return tx.order.findUnique({
          where: { id: order.id },
          include: { orderItems: true, customer: true },
        });
      })
      .then(async (createdOrder) => {
        if (!createdOrder) return createdOrder;
        // Asiento contable: venta a crédito (130505) + COGS. Best-effort, no bloquea.
        try {
          await this.journalAutoService.onConsignmentSelloutCompleted(
            createdOrder.id,
          );
        } catch (err: any) {
          console.error(
            `[JournalAuto] Error generando asiento de sell-out orden ${createdOrder.id}: ${err.message}`,
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
