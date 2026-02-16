import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateClothingColorDto } from './dto/create-clothing-color.dto';
import { UpdateClothingColorDto } from './dto/update-clothing-color.dto';
@Injectable()
export class ClothingColorService {
  constructor(private readonly prisma: PrismaService) { }

  create(createClothingColorDto: CreateClothingColorDto) {
    return this.prisma.clothingColor.create({
      data: createClothingColorDto,
    });
  }

  async createContextual(
    id_design: number,
    id_color: number,
    sizes: { id_size: number; quantity_produced: number; quantity_available: number }[]
  ) {
    try {
      console.log('createContextual called with:', {
        id_design,
        id_color,
        sizesCount: sizes?.length
      });

      // 1. Get Metadata
      const design = await this.prisma.design.findUnique({
        where: { id: id_design },
        include: {
          clothing: {
            include: { category: true },
          },
          collection: true,
        },
      });

      if (!design) throw new NotFoundException('Design not found');
      if (!design.clothing) throw new BadRequestException('Design has no associated clothing');

      const color = await this.prisma.color.findUnique({ where: { id: id_color } });
      if (!color) throw new NotFoundException('Color not found');

      // 2. Create Database Records (Parent + Children)
      const result = await this.prisma.$transaction(async (tx) => {
        // Create Parent (ClothingColor)
        const clothingColor = await tx.clothingColor.create({
          data: {
            id_design,
            id_color,
          },
        });

        // Create Children (ClothingSize)
        const createdSizes: any[] = [];
        for (const sizeData of sizes) {
          const clothingSize = await tx.clothingSize.create({
            data: {
              id_clothing_color: clothingColor.id,
              id_size: sizeData.id_size,
              quantity_produced: sizeData.quantity_produced,
              quantity_available: sizeData.quantity_available,
              quantity_sold: 0,
              quantity_on_consignment: 0,
              quantity_under_warranty: 0,
            },
          });
          createdSizes.push(clothingSize);
        }

        return { clothingColor, clothingSizes: createdSizes };
      });

      return result;

    } catch (error) {
      console.error('Error in createContextual service:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Processing failed: ${error.message}`);
    }
  }

  findAll() {
    return this.prisma.clothingColor.findMany({
      include: {
        design: {
          select: {
            reference: true,
            clothing: {
              select: {
                name: true,
                gender: true,
              },
            },
          },
        },
        color: {
          select: {
            name: true,
          },
        },
        clothingSizes: {
          include: {
            size: true
          }
        }
      },
    });
  }

  async findOne(id: number) {
    const clothingColor = await this.prisma.clothingColor.findUnique({
      where: { id },
      include: {
        design: {
          select: {
            reference: true,
            clothing: {
              select: {
                name: true,
                gender: true,
              },
            },
          },
        },
        color: {
          select: {
            name: true,
          },
        },
        clothingSizes: {
          include: {
            size: true
          }
        }
      },
    });
    if (!clothingColor) {
      throw new NotFoundException(`ClothingColor with ID "${id}" not found`);
    }
    return clothingColor;
  }

  async update(id: number, updateClothingColorDto: UpdateClothingColorDto) {
    await this.findOne(id);

    const { id_color, id_design, ...otherData } = updateClothingColorDto;
    const dataToUpdate: any = { ...otherData };

    if (id_color) dataToUpdate.color = { connect: { id: id_color } };
    if (id_design) dataToUpdate.design = { connect: { id: id_design } };

    return this.prisma.clothingColor.update({
      where: { id },
      data: dataToUpdate,
      include: {
        design: true,
        color: true,
        clothingSizes: true
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Find all sizes
        const sizes = await tx.clothingSize.findMany({ where: { id_clothing_color: id } });

        // 2. Delete stock dependent on sizes
        // 2. Delete Products? (If exist)
        if (sizes.length > 0) {
          await tx.product.deleteMany({
            where: { id_clothing_size: { in: sizes.map(s => s.id) } }
          });
        }

        // 4. Delete ClothingSizes
        await tx.clothingSize.deleteMany({
          where: { id_clothing_color: id }
        });

        // 5. Delete Parent
        return await tx.clothingColor.delete({
          where: { id },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException(
            `No se puede eliminar la variante porque tiene registros relacionados.`
          );
        }
      }
      throw error;
    }
  }
}
