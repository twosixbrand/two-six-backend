import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClothingDto } from './dto/create-clothing.dto';
import { UpdateClothingDto } from './dto/update-clothing.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Clothing } from '@prisma/client';

@Injectable()
export class ClothingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea una nueva prenda, verificando que las relaciones existan.
   */
  async create(createClothingDto: CreateClothingDto): Promise<Clothing> {
    const { id_type_clothing, id_category } = createClothingDto;

    // Verificar que el tipo de prenda y la categoría existan
    await this.prisma.typeClothing.findUniqueOrThrow({
      where: { id: id_type_clothing },
    });
    await this.prisma.category.findUniqueOrThrow({
      where: { id: id_category },
    });

    return this.prisma.clothing.create({
      data: createClothingDto,
    });
  }

  /**
   * Obtiene todas las prendas con sus relaciones.
   */
  findAll(): Promise<Clothing[]> {
    return this.prisma.clothing.findMany({
      include: {
        typeClothing: true,
        category: true,
      },
    });
  }

  /**
   * Busca una prenda por su ID, incluyendo sus relaciones.
   * @throws NotFoundException si la prenda no se encuentra.
   */
  async findOne(id: number): Promise<Clothing> {
    const clothing = await this.prisma.clothing.findUnique({
      where: { id },
      include: {
        typeClothing: true,
        category: true,
      },
    });

    if (!clothing) {
      throw new NotFoundException(`Prenda con ID #${id} no encontrada.`);
    }
    return clothing;
  }

  /**
   * Actualiza una prenda existente.
   * @throws NotFoundException si la prenda no se encuentra.
   */
  async update(id: number, updateClothingDto: UpdateClothingDto): Promise<Clothing> {
    await this.findOne(id); // Asegura que la prenda exista
    return this.prisma.clothing.update({
      where: { id },
      data: updateClothingDto,
    });
  }

  /**
   * Elimina una prenda existente.
   * @throws NotFoundException si la prenda no se encuentra.
   */
  async remove(id: number): Promise<Clothing> {
    await this.findOne(id); // Asegura que la prenda exista
    return this.prisma.clothing.delete({
      where: { id },
    });
  }
}
