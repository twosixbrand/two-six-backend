import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReturnItemDto } from './dto/create-return-item.dto';
import { UpdateReturnItemDto } from './dto/update-return-item.dto';

@Injectable()
export class ReturnItemService {
  constructor(private readonly prisma: PrismaService) {}

  create(createReturnItemDto: CreateReturnItemDto) {
    return this.prisma.returnItem.create({
      data: createReturnItemDto,
    });
  }

  findAll() {
    return this.prisma.returnItem.findMany();
  }

  async findOne(id: number) {
    const returnItem = await this.prisma.returnItem.findUnique({
      where: { id },
    });
    if (!returnItem) {
      throw new NotFoundException(`ReturnItem with ID "${id}" not found`);
    }
    return returnItem;
  }

  async update(id: number, updateReturnItemDto: UpdateReturnItemDto) {
    try {
      return await this.prisma.returnItem.update({
        where: { id },
        data: updateReturnItemDto,
      });
    } catch (error) {
      throw new NotFoundException(`ReturnItem with ID "${id}" not found`);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.returnItem.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException(`ReturnItem with ID "${id}" not found`);
    }
  }
}
