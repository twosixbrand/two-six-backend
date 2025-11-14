import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDesignClothingDto } from './dto/create-design-clothing.dto';
import { UpdateDesignClothingDto } from './dto/update-design-clothing.dto';

@Injectable()
export class DesignClothingService {
  constructor(private readonly prisma: PrismaService) {}

  create(createDesignClothingDto: CreateDesignClothingDto) {
    return this.prisma.designClothing.create({
      data: createDesignClothingDto,
    });
  }

  findAll() {
    return this.prisma.designClothing.findMany({
      include: {
        design: {
          select: {
            clothing: {
              select: {
                name: true,
              },
            },
          },
        },
        color: {
          select: {
            name: true,
          },
        },
        size: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const designClothing = await this.prisma.designClothing.findUnique({
      where: { id },
      include: {
        design: {
          select: {
            clothing: {
              select: {
                name: true,
              },
            },
          },
        },
        color: {
          select: {
            name: true,
          },
        },
        size: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!designClothing) {
      throw new NotFoundException(`DesignClothing with ID "${id}" not found`);
    }
    return designClothing;
  }

  update(id: number, updateDesignClothingDto: UpdateDesignClothingDto) {
    // Este método no necesita cambios para este requerimiento
    return `This action updates a #${id} designClothing`;
  }

  remove(id: number) {
    // Este método no necesita cambios para este requerimiento
    return `This action removes a #${id} designClothing`;
  }
}
