import { Controller, Post, Get, Body, Param, ParseIntPipe, Query , UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';


@ApiTags('inventory')
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('adjustments')
  @ApiOperation({ summary: 'Crear un nuevo ajuste de inventario (Merma, Regalo, etc.)' })
  createAdjustment(@Body() data: {
    reason: 'MERMA' | 'REGALO' | 'SOBRANTE' | 'ERROR_CONTEO';
    description?: string;
    userId?: number;
    items: { clothingSizeId: number; quantity: number }[];
  }) {
    return this.inventoryService.createAdjustment(data);
  }

  @Get('kardex/:clothingSizeId')
  @ApiOperation({ summary: 'Consultar el historial de movimientos (Kardex) de un producto' })
  getKardex(@Param('clothingSizeId', ParseIntPipe) clothingSizeId: number) {
    return this.inventoryService.getKardexByProduct(clothingSizeId);
  }

  // Opcional: Listar todos los ajustes realizados
  @Get('adjustments')
  @ApiOperation({ summary: 'Listar todos los ajustes de inventario realizados' })
  findAllAdjustments() {
    // Implementación rápida en el controlador o mover a service
    // @ts-ignore
    return this.inventoryService.prisma.inventoryAdjustment.findMany({
      include: {
        items: {
          include: {
            clothingSize: {
              include: {
                clothingColor: {
                  include: {
                    design: true,
                    color: true
                  }
                },
                size: true
              }
            }
          }
        }
      },
      orderBy: { adjustment_date: 'desc' }
    });
  }
}
