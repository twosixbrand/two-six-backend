import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ConsignmentReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inventario por cliente:
   * - Stock actual por bodega (en tránsito vs en consignación)
   * - Totales históricos: despachado recibido, vendido (sell-out), devuelto por tipo
   */
  async inventoryByCustomer(id_customer?: number) {
    const customers = await this.prisma.customer.findMany({
      where: {
        is_consignment_ally: true,
        ...(id_customer && { id: id_customer }),
      },
      select: {
        id: true,
        name: true,
        document_number: true,
        consignmentWarehouses: {
          select: {
            id: true,
            name: true,
            is_active: true,
            stocks: {
              select: {
                status: true,
                quantity: true,
              },
            },
            dispatches: {
              where: { status: 'RECIBIDO' },
              select: {
                items: { select: { quantity: true } },
              },
            },
            returns: {
              where: { status: 'PROCESSED' },
              select: {
                return_type: true,
                items: { select: { quantity: true } },
              },
            },
          },
        },
      },
    });

    const selloutOrdersByCustomer = await this.prisma.order.groupBy({
      by: ['id_customer'],
      where: { status: 'SELLOUT' },
      _sum: { total_payment: true },
      _count: true,
    });

    const selloutItemsByCustomer = await this.prisma.orderItem.findMany({
      where: {
        order: { status: 'SELLOUT', ...(id_customer && { id_customer }) },
      },
      select: {
        quantity: true,
        order: { select: { id_customer: true } },
      },
    });

    const soldUnitsByCustomer = new Map<number, number>();
    for (const it of selloutItemsByCustomer) {
      const prev = soldUnitsByCustomer.get(it.order.id_customer) ?? 0;
      soldUnitsByCustomer.set(it.order.id_customer, prev + it.quantity);
    }

    return customers.map((c) => {
      const warehouses = c.consignmentWarehouses.map((w) => {
        const pending = w.stocks
          .filter((s) => s.status === 'PENDIENTE_RECEPCION')
          .reduce((sum, s) => sum + s.quantity, 0);
        const active = w.stocks
          .filter((s) => s.status === 'EN_CONSIGNACION')
          .reduce((sum, s) => sum + s.quantity, 0);
        const dispatched_received = w.dispatches.reduce(
          (sum, d) => sum + d.items.reduce((s, it) => s + it.quantity, 0),
          0,
        );
        const returns_by_type = {
          PORTFOLIO: 0,
          WARRANTY: 0,
          POST_SALE: 0,
        };
        for (const r of w.returns) {
          const qty = r.items.reduce((s, it) => s + it.quantity, 0);
          returns_by_type[r.return_type] += qty;
        }
        return {
          id: w.id,
          name: w.name,
          is_active: w.is_active,
          current_pending_reception: pending,
          current_in_consignment: active,
          total_dispatched_received: dispatched_received,
          total_returned: returns_by_type,
        };
      });

      const sellout = selloutOrdersByCustomer.find((r) => r.id_customer === c.id);

      return {
        id: c.id,
        name: c.name,
        document_number: c.document_number,
        warehouses,
        totals: {
          sellout_orders: sellout?._count ?? 0,
          sellout_total_invoiced: Number(sellout?._sum.total_payment ?? 0),
          sellout_units: soldUnitsByCustomer.get(c.id) ?? 0,
        },
      };
    });
  }

  /**
   * Reporte de mermas y garantías en un rango (opcional).
   * - Mermas: orders con status=MERMA
   * - Garantías: ConsignmentReturn type=WARRANTY status=PROCESSED
   */
  async lossReport(from?: Date, to?: Date) {
    const dateFilter: any = {};
    if (from) dateFilter.gte = from;
    if (to) dateFilter.lte = to;

    const mermaOrders = await this.prisma.order.findMany({
      where: {
        status: 'MERMA',
        ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
      },
      select: {
        id: true,
        order_reference: true,
        createdAt: true,
        total_payment: true,
        iva: true,
        id_customer: true,
        customer: { select: { id: true, name: true } },
        orderItems: {
          select: { quantity: true, unit_price: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const warrantyReturns = await this.prisma.consignmentReturn.findMany({
      where: {
        return_type: 'WARRANTY',
        status: 'PROCESSED',
        ...(Object.keys(dateFilter).length && { processed_at: dateFilter }),
      },
      select: {
        id: true,
        processed_at: true,
        notes: true,
        warehouse: {
          select: {
            id: true,
            name: true,
            customer: { select: { id: true, name: true } },
          },
        },
        items: { select: { quantity: true } },
      },
      orderBy: { processed_at: 'desc' },
    });

    // Agregados por cliente
    const perCustomer = new Map<
      number,
      {
        id: number;
        name: string;
        merma_orders: number;
        merma_units: number;
        merma_total: number;
        warranty_returns: number;
        warranty_units: number;
      }
    >();

    for (const o of mermaOrders) {
      const units = o.orderItems.reduce((s, it) => s + it.quantity, 0);
      const existing = perCustomer.get(o.id_customer) ?? {
        id: o.id_customer,
        name: o.customer.name,
        merma_orders: 0,
        merma_units: 0,
        merma_total: 0,
        warranty_returns: 0,
        warranty_units: 0,
      };
      existing.merma_orders += 1;
      existing.merma_units += units;
      existing.merma_total += o.total_payment;
      perCustomer.set(o.id_customer, existing);
    }

    for (const w of warrantyReturns) {
      const customerId = w.warehouse.customer.id;
      const units = w.items.reduce((s, it) => s + it.quantity, 0);
      const existing = perCustomer.get(customerId) ?? {
        id: customerId,
        name: w.warehouse.customer.name,
        merma_orders: 0,
        merma_units: 0,
        merma_total: 0,
        warranty_returns: 0,
        warranty_units: 0,
      };
      existing.warranty_returns += 1;
      existing.warranty_units += units;
      perCustomer.set(customerId, existing);
    }

    return {
      merma_orders: mermaOrders.map((o) => ({
        id: o.id,
        order_reference: o.order_reference,
        date: o.createdAt,
        customer: o.customer.name,
        units: o.orderItems.reduce((s, it) => s + it.quantity, 0),
        total: o.total_payment,
      })),
      warranty_returns: warrantyReturns.map((r) => ({
        id: r.id,
        date: r.processed_at,
        customer: r.warehouse.customer.name,
        warehouse: r.warehouse.name,
        units: r.items.reduce((s, it) => s + it.quantity, 0),
        notes: r.notes,
      })),
      by_customer: Array.from(perCustomer.values()),
      summary: {
        total_merma_orders: mermaOrders.length,
        total_merma_units: mermaOrders.reduce((s, o) => s + o.orderItems.reduce((a, it) => a + it.quantity, 0), 0),
        total_merma_amount: mermaOrders.reduce((s, o) => s + o.total_payment, 0),
        total_warranty_returns: warrantyReturns.length,
        total_warranty_units: warrantyReturns.reduce((s, r) => s + r.items.reduce((a, it) => a + it.quantity, 0), 0),
      },
    };
  }

  /**
   * Bodegas con conciliación pendiente: sin conteo APROBADO en los últimos N días
   * (default 30). Si nunca se hizo un conteo, se reporta desde la creación de la bodega.
   */
  async pendingReconciliation(threshold_days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - threshold_days);

    const warehouses = await this.prisma.consignmentWarehouse.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        createdAt: true,
        customer: { select: { id: true, name: true } },
        cycleCounts: {
          where: { status: 'APPROVED' },
          orderBy: { approved_at: 'desc' },
          take: 1,
          select: { id: true, approved_at: true },
        },
        stocks: {
          where: { status: 'EN_CONSIGNACION' },
          select: { quantity: true },
        },
      },
    });

    const pending = warehouses
      .map((w) => {
        const last = w.cycleCounts[0];
        const lastDate = last?.approved_at ?? w.createdAt;
        const daysSince = Math.floor(
          (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24),
        );
        const current_stock = w.stocks.reduce((s, st) => s + st.quantity, 0);
        return {
          warehouse_id: w.id,
          warehouse_name: w.name,
          customer_id: w.customer.id,
          customer_name: w.customer.name,
          last_count_id: last?.id ?? null,
          last_count_date: last?.approved_at ?? null,
          days_since_last_count: daysSince,
          current_stock_units: current_stock,
          is_pending: daysSince > threshold_days || !last,
          never_counted: !last,
        };
      })
      .filter((w) => w.is_pending);

    return {
      threshold_days,
      cutoff_date: cutoff,
      pending_count: pending.length,
      warehouses: pending.sort((a, b) => b.days_since_last_count - a.days_since_last_count),
    };
  }
}
