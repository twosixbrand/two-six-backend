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
            reference: true, // Incluir la referencia del diseño
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
            reference: true, // Incluir la referencia del diseño
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

  async update(id: number, updateDesignClothingDto: UpdateDesignClothingDto) {
    await this.findOne(id); // Asegura que el registro exista antes de intentar actualizar

    const { id_color, id_size, id_design, ...otherData } =
      updateDesignClothingDto;

    const dataToUpdate: any = { ...otherData };

    if (id_color) {
      dataToUpdate.color = { connect: { id: id_color } };
    }
    if (id_size) {
      dataToUpdate.size = { connect: { id: id_size } };
    }
    if (id_design) {
      dataToUpdate.design = { connect: { id: id_design } };
    }

    return this.prisma.designClothing.update({
      where: { id },
      data: dataToUpdate,
      include: {
        design: {
          select: {
            reference: true,
            clothing: {
              select: {
                name: true,
              },
            },
          },
        },
        color: {
          select: { name: true },
        },
        size: {
          select: { name: true },
        },
      },
    });
  }

  remove(id: number) {
    // Este método no necesita cambios para este requerimiento
    return `This action removes a #${id} designClothing`;
  }
}
