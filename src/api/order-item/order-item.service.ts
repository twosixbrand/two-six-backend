import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

@Injectable()
export class OrderItemService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrderItemDto: CreateOrderItemDto) {
    const { id_order, id_product } = createOrderItemDto;

    // Validar que la orden y el producto existen
    const order = await this.prisma.order.findUnique({ where: { id: id_order } });
    if (!order) {
      throw new NotFoundException(`La orden con ID #${id_order} no fue encontrada.`);
    }

    const product = await this.prisma.product.findUnique({
      where: { id: id_product },
    });
    if (!product) {
      throw new NotFoundException(
        `El producto con ID #${id_product} no fue encontrado.`,
      );
    }

    return this.prisma.orderItem.create({
      data: createOrderItemDto,
    });
  }

  findAll() {
    return this.prisma.orderItem.findMany({
      include: {
        order: true,
        product: true,
      },
    });
  }

  async findOne(id: number) {
    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id },
      include: {
        order: true,
        product: true,
      },
    });

    if (!orderItem) {
      throw new NotFoundException(`Ítem de orden con ID #${id} no encontrado.`);
    }
    return orderItem;
  }

  async update(id: number, updateOrderItemDto: UpdateOrderItemDto) {
    await this.findOne(id); // Asegura que el ítem exista
    return this.prisma.orderItem.update({
      where: { id },
      data: updateOrderItemDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Asegura que el ítem exista
    return this.prisma.orderItem.delete({
      where: { id },
    });
  }
}
