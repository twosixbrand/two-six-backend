import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AgingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cartera por Edades — Accounts Receivable Aging Report
   * Groups COD orders that are not yet delivered or rejected by age buckets.
   */
  async getAgingReport() {
    const now = new Date();

    // Get orders where payment_method is WOMPI_COD and status is not terminal
    const orders = await this.prisma.order.findMany({
      where: {
        payment_method: 'WOMPI_COD',
        status: {
          notIn: ['Entregado', 'Rechazado'],
        },
      },
      include: {
        customer: true,
      },
      orderBy: { order_date: 'asc' },
    });

    const buckets = {
      current: { label: '0-30 dias', orders: [] as any[], total: 0 },
      days31_60: { label: '31-60 dias', orders: [] as any[], total: 0 },
      days61_90: { label: '61-90 dias', orders: [] as any[], total: 0 },
      over90: { label: 'Mas de 90 dias', orders: [] as any[], total: 0 },
    };

    let totalOutstanding = 0;

    for (const order of orders) {
      const orderDate = new Date(order.order_date);
      const diffMs = now.getTime() - orderDate.getTime();
      const daysOutstanding = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      const entry = {
        orderId: order.id,
        orderReference: order.order_reference,
        customerName: order.customer?.name || 'N/A',
        orderDate: order.order_date,
        status: order.status,
        amount: order.cod_amount || order.total_payment,
        daysOutstanding,
      };

      totalOutstanding += entry.amount;

      if (daysOutstanding <= 30) {
        buckets.current.orders.push(entry);
        buckets.current.total += entry.amount;
      } else if (daysOutstanding <= 60) {
        buckets.days31_60.orders.push(entry);
        buckets.days31_60.total += entry.amount;
      } else if (daysOutstanding <= 90) {
        buckets.days61_90.orders.push(entry);
        buckets.days61_90.total += entry.amount;
      } else {
        buckets.over90.orders.push(entry);
        buckets.over90.total += entry.amount;
      }
    }

    return {
      generatedAt: now.toISOString(),
      summary: {
        current: { label: buckets.current.label, total: buckets.current.total, count: buckets.current.orders.length },
        days31_60: { label: buckets.days31_60.label, total: buckets.days31_60.total, count: buckets.days31_60.orders.length },
        days61_90: { label: buckets.days61_90.label, total: buckets.days61_90.total, count: buckets.days61_90.orders.length },
        over90: { label: buckets.over90.label, total: buckets.over90.total, count: buckets.over90.orders.length },
      },
      totalOutstanding,
      totalOrders: orders.length,
      detail: {
        current: buckets.current.orders,
        days31_60: buckets.days31_60.orders,
        days61_90: buckets.days61_90.orders,
        over90: buckets.over90.orders,
      },
    };
  }
}
