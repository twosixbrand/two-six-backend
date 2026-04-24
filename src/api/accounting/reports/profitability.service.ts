import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ProfitabilityService {
  constructor(private prisma: PrismaService) {}

  async getProfitabilityByDesign(startDate: Date, endDate: Date) {
    // 1. Obtener todos los items vendidos en el rango
    const items = await (this.prisma.orderItem as any).findMany({
      where: {
        order: {
          order_date: { gte: startDate, lte: endDate },
          status: 'PAID',
        },
      },
      include: {
        product: {
          include: {
            clothingSize: {
              include: {
                clothingColor: {
                  include: {
                    design: { include: { collection: true } },
                  },
                },
              },
            },
          },
        },
        order: {
          include: { taxTransactions: true },
        },
      },
    });

    // 2. Agrupar por Diseño
    const analysis: Record<number, any> = {};

    for (const item of items) {
      // @ts-ignore
      const design = item.product?.clothingSize?.clothingColor?.design;
      if (!design) continue;

      if (!analysis[design.id]) {
        analysis[design.id] = {
          designId: design.id,
          name: design.name,
          collection: design.collection?.name || 'Sin Colección',
          qtySold: 0,
          grossRevenue: 0,
          manufacturedCost: 0,
          taxes: 0,
          gatewayCommissions: 0,
        };
      }

      const node = analysis[design.id];
      node.qtySold += item.quantity;
      node.grossRevenue += item.quantity * item.unit_price;
      node.manufacturedCost += item.quantity * (design.manufactured_cost || 0);

      // Calcular impuestos proporcionales de la orden para este item
      // @ts-ignore
      const orderSubtotal = item.order.total_payment - (item.order.iva || 0);
      const itemSubtotal = item.quantity * item.unit_price;
      const weight = itemSubtotal / (orderSubtotal || 1);

      // @ts-ignore
      const orderTaxes = item.order.taxTransactions.reduce(
        (acc, t) => acc + t.tax_amount,
        0,
      );
      node.taxes += orderTaxes * weight;

      // Estimar comisión de pasarela
      const estimatedCommission = itemSubtotal * 0.0349 + 900 * weight;
      node.gatewayCommissions += estimatedCommission;
    }

    // 3. Formatear resultados finales
    return Object.values(analysis)
      .map((d) => ({
        ...d,
        netProfit:
          d.grossRevenue - d.manufacturedCost - d.taxes - d.gatewayCommissions,
        marginPercentage:
          d.grossRevenue > 0
            ? ((d.grossRevenue -
                d.manufacturedCost -
                d.taxes -
                d.gatewayCommissions) /
                d.grossRevenue) *
              100
            : 0,
      }))
      .sort((a, b) => b.netProfit - a.netProfit);
  }

  async getProfitabilityByCollection(startDate: Date, endDate: Date) {
    const designs = await this.getProfitabilityByDesign(startDate, endDate);
    const collections: Record<string, any> = {};

    for (const d of designs) {
      if (!collections[d.collection]) {
        collections[d.collection] = {
          name: d.collection,
          qtySold: 0,
          grossRevenue: 0,
          manufacturedCost: 0,
          taxes: 0,
          gatewayCommissions: 0,
          netProfit: 0,
        };
      }
      const c = collections[d.collection];
      c.qtySold += d.qtySold;
      c.grossRevenue += d.grossRevenue;
      c.manufacturedCost += d.manufacturedCost;
      c.taxes += d.taxes;
      c.gatewayCommissions += d.gatewayCommissions;
      c.netProfit += d.netProfit;
    }

    return Object.values(collections)
      .map((c) => ({
        ...c,
        marginPercentage:
          c.grossRevenue > 0 ? (c.netProfit / c.grossRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.netProfit - a.netProfit);
  }
}
