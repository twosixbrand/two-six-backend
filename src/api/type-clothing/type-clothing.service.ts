import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTypeClothingDto } from './dto/create-type-clothing.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateTypeClothingDto } from './dto/update-type-clothing.dto';
import { TypeClothing } from '@prisma/client';

@Injectable()
export class TypeClothingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un nuevo tipo de prenda.
   */
  create(createTypeClothingDto: CreateTypeClothingDto): Promise<TypeClothing> {
    return this.prisma.typeClothing.create({ data: createTypeClothingDto });
  }

  /**
   * Obtiene todos los tipos de prenda.
   */
  findAll(): Promise<TypeClothing[]> {
    return this.prisma.typeClothing.findMany();
  }

  /**
   * Busca un tipo de prenda por su ID.
   * @throws NotFoundException si el tipo de prenda no se encuentra.
   */
  async findOne(id: string): Promise<TypeClothing> {
    const typeClothing = await this.prisma.typeClothing.findUnique({
      where: { id },
    });

    if (!typeClothing) {
      throw new NotFoundException(
        `Tipo de prenda con ID #${id} no encontrado.`,
      );
    }
    return typeClothing;
  }

  /**
   * Actualiza un tipo de prenda existente.
   * @throws NotFoundException si el tipo de prenda no se encuentra.
   */
  async update(
    id: string,
    updateTypeClothingDto: UpdateTypeClothingDto,
  ): Promise<TypeClothing> {
    await this.findOne(id); // Asegura que el tipo de prenda exista
    return this.prisma.typeClothing.update({
      where: { id },
      data: updateTypeClothingDto,
    });
  }

  /**
   * Elimina un tipo de prenda existente.
   * @throws NotFoundException si el tipo de prenda no se encuentra.
   */
  async remove(id: string): Promise<TypeClothing> {
    await this.findOne(id); // Asegura que el tipo de prenda exista
    return this.prisma.typeClothing.delete({
      where: { id },
    });
  }
}
