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
        current: {
          label: buckets.current.label,
          total: buckets.current.total,
          count: buckets.current.orders.length,
        },
        days31_60: {
          label: buckets.days31_60.label,
          total: buckets.days31_60.total,
          count: buckets.days31_60.orders.length,
        },
        days61_90: {
          label: buckets.days61_90.label,
          total: buckets.days61_90.total,
          count: buckets.days61_90.orders.length,
        },
        over90: {
          label: buckets.over90.label,
          total: buckets.over90.total,
          count: buckets.over90.orders.length,
        },
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

  /**
   * Cartera por Edades — Accounts Payable (CxP) Aging Report
   * Groups PENDING expenses by age buckets (uses due_date or expense_date).
   */
  async getPayablesAging() {
    const now = new Date();

    const expenses = await this.prisma.expense.findMany({
      where: {
        payment_status: 'PENDING',
      },
      include: {
        provider: true,
        expenseCategory: true,
      },
      orderBy: { expense_date: 'asc' },
    });

    const buckets = {
      current: { label: '0-30 dias', items: [] as any[], total: 0 },
      days31_60: { label: '31-60 dias', items: [] as any[], total: 0 },
      days61_90: { label: '61-90 dias', items: [] as any[], total: 0 },
      over90: { label: 'Mas de 90 dias', items: [] as any[], total: 0 },
    };

    let totalOutstanding = 0;

    for (const expense of expenses) {
      const referenceDate = expense.due_date
        ? new Date(expense.due_date)
        : new Date(expense.expense_date);
      const diffMs = now.getTime() - referenceDate.getTime();
      const daysOutstanding = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      const entry = {
        expenseId: expense.id,
        expenseNumber: expense.expense_number,
        providerName: expense.provider?.company_name || 'Sin proveedor',
        providerNit: expense.provider?.id || '',
        invoiceNumber: expense.invoice_number || '',
        category: expense.expenseCategory?.name || '',
        expenseDate: expense.expense_date,
        dueDate: expense.due_date,
        amount: expense.total,
        daysOutstanding: Math.max(daysOutstanding, 0),
      };

      totalOutstanding += entry.amount;

      if (daysOutstanding <= 30) {
        buckets.current.items.push(entry);
        buckets.current.total += entry.amount;
      } else if (daysOutstanding <= 60) {
        buckets.days31_60.items.push(entry);
        buckets.days31_60.total += entry.amount;
      } else if (daysOutstanding <= 90) {
        buckets.days61_90.items.push(entry);
        buckets.days61_90.total += entry.amount;
      } else {
        buckets.over90.items.push(entry);
        buckets.over90.total += entry.amount;
      }
    }

    return {
      generatedAt: now.toISOString(),
      summary: {
        current: {
          label: buckets.current.label,
          total: buckets.current.total,
          count: buckets.current.items.length,
        },
        days31_60: {
          label: buckets.days31_60.label,
          total: buckets.days31_60.total,
          count: buckets.days31_60.items.length,
        },
        days61_90: {
          label: buckets.days61_90.label,
          total: buckets.days61_90.total,
          count: buckets.days61_90.items.length,
        },
        over90: {
          label: buckets.over90.label,
          total: buckets.over90.total,
          count: buckets.over90.items.length,
        },
      },
      totalOutstanding,
      totalExpenses: expenses.length,
      detail: {
        current: buckets.current.items,
        days31_60: buckets.days31_60.items,
        days61_90: buckets.days61_90.items,
        over90: buckets.over90.items,
      },
    };
  }

  /**
   * Valoración de Inventario — Inventory Valuation Report
   * Valora inventario al COSTO DE PRODUCCIÓN (manufactured_cost de Design)
   * conforme a NIC 2 / NIIF: menor entre costo y valor neto realizable.
   * Incluye ambos valores (costo y precio de venta) para análisis.
   */
  async getInventoryValuation() {
    const now = new Date();

    // Query active products with full hierarchy to get manufactured_cost
    const products = await this.prisma.product.findMany({
      where: { active: true },
      include: {
        clothingSize: {
          include: {
            size: true,
            clothingColor: {
              include: {
                color: true,
                design: {
                  include: {
                    clothing: {
                      include: {
                        category: true,
                        typeClothing: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Group by category
    const categoryMap: Record<
      string,
      {
        categoryName: string;
        totalUnits: number;
        totalCostValue: number;
        totalSaleValue: number;
        items: any[];
      }
    > = {};

    let globalTotalUnits = 0;
    let globalTotalCostValue = 0;
    let globalTotalSaleValue = 0;
    let totalActiveProducts = 0;

    for (const product of products) {
      const cs = product.clothingSize;
      if (!cs) continue;

      const cc = cs.clothingColor;
      const design = cc?.design;
      const clothing = design?.clothing;
      const categoryName = clothing?.category?.name || 'Sin Categoría';
      const typeName = clothing?.typeClothing?.name || '';
      const colorName = cc?.color?.name || '';
      const sizeName = cs.size?.name || '';
      const clothingName = clothing?.name || '';
      const designRef = design?.reference || '';

      // NIC 2: Costo de producción (manufactured_cost del diseño)
      const unitCost = design?.manufactured_cost || 0;
      // Precio de venta (para calcular valor neto realizable)
      const unitSalePrice = product.discount_price || product.price;
      const qty = cs.quantity_available;

      const lineCostValue = qty * unitCost;
      const lineSaleValue = qty * unitSalePrice;

      totalActiveProducts++;
      globalTotalUnits += qty;
      globalTotalCostValue += lineCostValue;
      globalTotalSaleValue += lineSaleValue;

      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = {
          categoryName,
          totalUnits: 0,
          totalCostValue: 0,
          totalSaleValue: 0,
          items: [],
        };
      }

      categoryMap[categoryName].totalUnits += qty;
      categoryMap[categoryName].totalCostValue += lineCostValue;
      categoryMap[categoryName].totalSaleValue += lineSaleValue;
      categoryMap[categoryName].items.push({
        productId: product.id,
        sku: product.sku || `P-${product.id}`,
        productName: `${clothingName} ${designRef}`.trim(),
        typeName,
        colorName,
        sizeName,
        quantityAvailable: qty,
        unitCost,
        unitSalePrice,
        lineCostValue,
        lineSaleValue,
        isOutlet: product.is_outlet,
        discountPercentage: product.discount_percentage,
      });
    }

    // Convert map to sorted array
    const categories = Object.values(categoryMap).sort(
      (a, b) => b.totalCostValue - a.totalCostValue,
    );

    return {
      generatedAt: now.toISOString(),
      summary: {
        totalActiveProducts,
        totalUnits: globalTotalUnits,
        totalCostValue: globalTotalCostValue,
        totalSaleValue: globalTotalSaleValue,
        potentialMargin: globalTotalSaleValue - globalTotalCostValue,
      },
      categories,
    };
  }
}
