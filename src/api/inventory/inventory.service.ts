import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JournalAutoService } from '../accounting/journal/journal-auto.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private readonly journalAuto: JournalAutoService,
  ) {}

  /**
   * Registra un movimiento en el Kardex y actualiza las cantidades disponibles.
   */
  async recordMovement(prisma: any, data: {
    clothingSizeId: number;
    type: 'IN' | 'OUT';
    sourceType: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN';
    sourceId?: number;
    quantity: number;
    description?: string;
    unitCost?: number;
  }) {
    const clothingSize = await prisma.clothingSize.findUnique({
      where: { id: data.clothingSizeId },
    });

    if (!clothingSize) {
      throw new NotFoundException(`Producto (Size ID: ${data.clothingSizeId}) no encontrado.`);
    }

    const balanceBefore = clothingSize.quantity_available;
    const balanceAfter = data.type === 'IN' 
      ? balanceBefore + data.quantity 
      : balanceBefore - data.quantity;

    if (balanceAfter < 0 && data.type === 'OUT') {
      throw new BadRequestException(`Stock insuficiente. Disponible: ${balanceBefore}, Requerido: ${data.quantity}`);
    }

    // 1. Actualizar Stock
    await prisma.clothingSize.update({
      where: { id: data.clothingSizeId },
      data: {
        quantity_available: balanceAfter,
        ...(data.sourceType === 'SALE' && { quantity_sold: { increment: data.quantity } }),
      },
    });

    // 2. Registrar en Kardex
    return prisma.inventoryKardex.create({
      data: {
        id_clothing_size: data.clothingSizeId,
        type: data.type,
        source_type: data.sourceType,
        source_id: data.sourceId,
        quantity: data.quantity,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        unit_cost: data.unitCost,
        description: data.description,
      },
    });
  }

  /**
   * Procesa un Ajuste de Inventario Completo (Merma, Regalo, etc.)
   */
  async createAdjustment(data: {
    reason: 'MERMA' | 'REGALO' | 'SOBRANTE' | 'ERROR_CONTEO';
    description?: string;
    userId?: number;
    items: { clothingSizeId: number; quantity: number }[];
  }) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Crear cabecera de ajuste
      const adjustment = await prisma.inventoryAdjustment.create({
        data: {
          reason: data.reason,
          description: data.description,
          id_user: data.userId,
          status: 'COMPLETED',
        },
      });

      for (const item of data.items) {
        // Obtener costo unitario desde el diseño
        const productInfo = await prisma.clothingSize.findUnique({
          where: { id: item.clothingSizeId },
          include: { clothingColor: { include: { design: true } } }
        });

        const unitCost = productInfo?.clothingColor?.design?.manufactured_cost || 0;
        const type = item.quantity > 0 ? 'IN' : 'OUT';
        const absoluteQty = Math.abs(item.quantity);

        // 2. Registrar Ítem del ajuste
        await prisma.inventoryAdjustmentItem.create({
          data: {
            id_inventory_adjustment: adjustment.id,
            id_clothing_size: item.clothingSizeId,
            quantity: item.quantity,
            unit_cost: unitCost,
          },
        });

        // 3. Registrar Movimiento Kardex y Actualizar Stock
        await this.recordMovement(prisma, {
          clothingSizeId: item.clothingSizeId,
          type: type as 'IN' | 'OUT',
          sourceType: 'ADJUSTMENT',
          sourceId: adjustment.id,
          quantity: absoluteQty,
          unitCost: unitCost,
          description: `Ajuste Inventario (${data.reason}): ${data.description || ''}`,
        });
      }

      // Generar Asiento Contable Automático basado en la razón
      // Se realiza fuera de la transaccion de inventario o dentro si se desea integridad total
      // Aqui lo hacemos al final para asegurar que el ajuste ya existe.
      await this.journalAuto.onInventoryAdjustment(adjustment.id);
      
      return adjustment;
    });
  }

  async getKardexByProduct(clothingSizeId: number) {
    return this.prisma.inventoryKardex.findMany({
      where: { id_clothing_size: clothingSizeId },
      orderBy: { date: 'desc' },
    });
  }
}
