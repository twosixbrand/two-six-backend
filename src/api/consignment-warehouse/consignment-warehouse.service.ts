import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateWarehouseDto {
  id_customer: number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  is_active?: boolean;
}

export type UpdateWarehouseDto = Partial<Omit<CreateWarehouseDto, 'id_customer'>>;

@Injectable()
export class ConsignmentWarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateWarehouseDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: data.id_customer },
    });
    if (!customer) {
      throw new NotFoundException(`Cliente #${data.id_customer} no encontrado.`);
    }
    if (!customer.is_consignment_ally) {
      throw new BadRequestException(
        `El cliente '${customer.name}' no está marcado como aliado de consignación. Habilita el flag is_consignment_ally antes de crearle una bodega.`,
      );
    }

    return this.prisma.consignmentWarehouse.create({
      data: {
        id_customer: data.id_customer,
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        is_active: data.is_active ?? true,
      },
    });
  }

  findAll(id_customer?: number) {
    return this.prisma.consignmentWarehouse.findMany({
      where: id_customer ? { id_customer } : undefined,
      include: {
        customer: { select: { id: true, name: true, document_number: true } },
      },
      orderBy: [{ id_customer: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: number) {
    const wh = await this.prisma.consignmentWarehouse.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, document_number: true } },
      },
    });
    if (!wh) {
      throw new NotFoundException(`Bodega de consignación #${id} no encontrada.`);
    }
    return wh;
  }

  async findStockByWarehouse(id: number) {
    await this.findOne(id);
    return this.prisma.consignmentStock.findMany({
      where: { id_warehouse: id },
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
      orderBy: [{ status: 'asc' }, { id_clothing_size: 'asc' }],
    });
  }

  async update(id: number, data: UpdateWarehouseDto) {
    await this.findOne(id);
    return this.prisma.consignmentWarehouse.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    // Cascade elimina ConsignmentStock asociado. Si hay stock con qty > 0 lo bloqueamos.
    const stockCount = await this.prisma.consignmentStock.count({
      where: { id_warehouse: id, quantity: { gt: 0 } },
    });
    if (stockCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar la bodega: tiene ${stockCount} registros de stock con unidades. Deja la bodega inactiva en su lugar.`,
      );
    }
    return this.prisma.consignmentWarehouse.delete({ where: { id } });
  }
}
