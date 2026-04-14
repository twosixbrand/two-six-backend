import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreatePriceDto {
  id_customer: number;
  id_product: number;
  price: number;
  valid_from?: string; // ISO
  valid_to?: string | null;
}

export type UpdatePriceDto = Partial<Omit<CreatePriceDto, 'id_customer' | 'id_product'>>;

@Injectable()
export class ConsignmentPriceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePriceDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: data.id_customer },
    });
    if (!customer) {
      throw new NotFoundException(`Cliente #${data.id_customer} no encontrado.`);
    }
    if (!customer.is_consignment_ally) {
      throw new BadRequestException(
        `El cliente '${customer.name}' no es aliado de consignación.`,
      );
    }

    const product = await this.prisma.product.findUnique({
      where: { id: data.id_product },
    });
    if (!product) {
      throw new NotFoundException(`Producto #${data.id_product} no encontrado.`);
    }

    if (data.price <= 0) {
      throw new BadRequestException('El precio debe ser mayor a 0.');
    }

    return this.prisma.customerConsignmentPrice.create({
      data: {
        id_customer: data.id_customer,
        id_product: data.id_product,
        price: data.price,
        valid_from: data.valid_from ? new Date(data.valid_from) : new Date(),
        valid_to: data.valid_to ? new Date(data.valid_to) : null,
      },
    });
  }

  findAll(filters: { id_customer?: number; id_product?: number; only_active?: boolean }) {
    const where: any = {};
    if (filters.id_customer) where.id_customer = filters.id_customer;
    if (filters.id_product) where.id_product = filters.id_product;
    if (filters.only_active) {
      const now = new Date();
      where.valid_from = { lte: now };
      where.OR = [{ valid_to: null }, { valid_to: { gte: now } }];
    }

    return this.prisma.customerConsignmentPrice.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, document_number: true } },
        product: {
          select: {
            id: true,
            price: true,
            sku: true,
            clothingSize: {
              include: {
                size: true,
                clothingColor: {
                  include: {
                    color: true,
                    design: { select: { id: true, reference: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ id_customer: 'asc' }, { valid_from: 'desc' }],
    });
  }

  async findOne(id: number) {
    const row = await this.prisma.customerConsignmentPrice.findUnique({
      where: { id },
    });
    if (!row) {
      throw new NotFoundException(`Precio de consignación #${id} no encontrado.`);
    }
    return row;
  }

  /**
   * Devuelve el precio vigente para un cliente/producto en la fecha dada (o ahora).
   * Usado por el flujo de facturación sell-out (Fase 3).
   */
  async getEffectivePrice(
    id_customer: number,
    id_product: number,
    at: Date = new Date(),
  ) {
    return this.prisma.customerConsignmentPrice.findFirst({
      where: {
        id_customer,
        id_product,
        valid_from: { lte: at },
        OR: [{ valid_to: null }, { valid_to: { gte: at } }],
      },
      orderBy: { valid_from: 'desc' },
    });
  }

  async update(id: number, data: UpdatePriceDto) {
    await this.findOne(id);
    if (data.price !== undefined && data.price <= 0) {
      throw new BadRequestException('El precio debe ser mayor a 0.');
    }
    return this.prisma.customerConsignmentPrice.update({
      where: { id },
      data: {
        ...(data.price !== undefined && { price: data.price }),
        ...(data.valid_from && { valid_from: new Date(data.valid_from) }),
        ...(data.valid_to !== undefined && {
          valid_to: data.valid_to ? new Date(data.valid_to) : null,
        }),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.customerConsignmentPrice.delete({ where: { id } });
  }
}
