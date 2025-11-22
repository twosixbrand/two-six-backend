import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMasterDesignDto } from './dto/create-master-design.dto';
import { UpdateMasterDesignDto } from './dto/update-master-design.dto';

@Injectable()
export class MasterDesignService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Construye la referencia a partir de los IDs relacionados.
   */
  private async buildReference(
    designId: number,
    collectionId: number,
    clothingId: number,
  ): Promise<string> {
    const [collection, clothing] = await Promise.all([
      this.prisma.collection.findUnique({ where: { id: collectionId } }),
      this.prisma.clothing.findUnique({ where: { id: clothingId } }),
    ]);

    if (!collection || !clothing) {
      throw new NotFoundException(
        'La colección o la prenda base no fueron encontradas.',
      );
    }

    const referenceParts = [
      collection.id_year_production,
      collection.id_season.toString(),
      clothing.id_type_clothing,
      clothing.id_category.toString(),
      designId.toString(),
    ];

    return referenceParts.join('').toUpperCase().replace(/\s/g, '');
  }

  async create(createMasterDesignDto: CreateMasterDesignDto) {
    // Usamos una transacción para asegurar la atomicidad de la operación.
    return this.prisma.$transaction(async (prisma) => {
      // 1. Crea el diseño con una referencia temporal para obtener su ID.
      const design = await prisma.design.create({
        data: {
          ...createMasterDesignDto,
          reference: 'temp', // Valor temporal
        },
      });

      // 2. Construye la referencia usando el ID del nuevo diseño.
      const reference = await this.buildReference(
        design.id,
        design.id_collection,
        design.id_clothing,
      );

      // 3. Actualiza el diseño con la referencia correcta.
      return prisma.design.update({
        where: { id: design.id },
        data: { reference },
      });
    });
  }

  findAll() {
    return this.prisma.design.findMany({
      include: {
        collection: {
          include: {
            season: true,
            yearProduction: true,
          },
        },
        designProviders: { // Incluir la nueva tabla intermedia
          include: {
            provider: true,
          },
        },
        clothing: true,
      },
    });
  }

  async findOne(id: number) {
    const design = await this.prisma.design.findUnique({
      where: { id },
      include: {
        collection: {
          include: {
            season: true,
            yearProduction: true,
          },
        },
        designProviders: { // Incluir la nueva tabla intermedia
          include: {
            provider: true,
          },
        },
        clothing: true,
      },
    });
    if (!design) {
      throw new NotFoundException(`Diseño con ID #${id} no encontrado.`);
    }
    return design;
  }

  async update(id: number, updateMasterDesignDto: UpdateMasterDesignDto) {
    await this.findOne(id);

    const shouldRecalculateReference =
      updateMasterDesignDto.id_collection ||
      updateMasterDesignDto.id_clothing;

    // Si no se necesita recalcular, simplemente actualizamos.
    if (!shouldRecalculateReference) {
      return this.prisma.design.update({
        where: { id },
        data: updateMasterDesignDto,
      });
    }

    // Si se necesita recalcular, actualizamos los datos y luego la referencia.
    const updatedDesign = await this.prisma.design.update({
      where: { id },
      data: updateMasterDesignDto,
    });

    const newReference = await this.buildReference(
      id,
      updatedDesign.id_collection,
      updatedDesign.id_clothing,
    );

    return this.prisma.design.update({
      where: { id },
      data: { reference: newReference },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    try {
      return await this.prisma.design.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException(
        `No se pudo eliminar el diseño. Puede que tenga relaciones activas.`,
      );
    }
  }
}
