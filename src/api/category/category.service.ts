import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Category } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea una nueva categoría.
   */
  create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.prisma.category.create({ data: createCategoryDto });
  }

  /**
   * Obtiene todas las categorías.
   */
  findAll(): Promise<Category[]> {
    return this.prisma.category.findMany();
  }

  /**
   * Busca una categoría por su ID.
   * @throws NotFoundException si la categoría no se encuentra.
   */
  async findOne(id: number): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Categoría con ID #${id} no encontrada.`);
    }

    return category;
  }

  /**
   * Actualiza una categoría existente.
   * @throws NotFoundException si la categoría no se encuentra.
   */
  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    await this.findOne(id); // Asegura que la categoría exista
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  /**
   * Elimina una categoría existente.
   * @throws NotFoundException si la categoría no se encuentra.
   */
  async remove(id: number): Promise<Category> {
    await this.findOne(id); // Asegura que la categoría exista
    return this.prisma.category.delete({
      where: { id },
    });
  }
}