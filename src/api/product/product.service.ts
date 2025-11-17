import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Gender, Prisma, Product } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly productWithDetails = {
    designClothing: {
      include: {
        color: true,
        size: true,
        design: {
          include: {
            clothing: {
              include: {
                typeClothing: true,
                category: true,
              },
            },
          },
        },
      },
    },
  };

  private getProductWithDetails() {
    return this.productWithDetails;
  }

  /**
   * Crea un nuevo producto en la base de datos.
   * @param createProductDto - DTO con los datos para crear el producto.
   * @returns El producto creado.
   * @throws NotFoundException si el id_design_clothing no existe.
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { id_design_clothing, ...productData } = createProductDto;

    // 1. Verificar si el designClothing asociado existe.
    const designClothingExists = await this.prisma.designClothing.findUnique({
      where: { id: id_design_clothing },
    });

    if (!designClothingExists) {
      throw new NotFoundException(
        `La variante de diseño con ID #${id_design_clothing} no fue encontrada.`,
      );
    }

    // 2. Crear el producto conectándolo con el designClothing.
    return this.prisma.product.create({
      data: {
        ...productData,
        // Asignar valores por defecto si no vienen en el DTO.
        active: productData.active ?? true, // Mantenido
        is_outlet: productData.is_outlet ?? false, // Corregido de 'outlet' a 'is_outlet'
        designClothing: {
          connect: {
            id: id_design_clothing,
          },
        },
      },
    });
  }

  /**
   * Encuentra todos los productos, con filtros opcionales por género y si es outlet.
   * Devuelve una vista enriquecida del producto con sus relaciones.
   * @param gender - Género para filtrar los productos (opcional).
   * @param is_outlet - Booleano para filtrar si el producto es outlet (opcional).
   */
  findAll(gender?: Gender, is_outlet?: boolean) {
    const where: Prisma.ProductWhereInput = {
      active: true, // Por defecto, solo trae productos activos.
    };

    if (is_outlet !== undefined) {
      where.is_outlet = is_outlet;
    }

    if (gender) {
      // Filtro anidado a través de las relaciones para llegar al género.
      where.designClothing = {
        design: {
          clothing: {
            gender: gender,
          },
        },
      };
    }

    return this.prisma.product.findMany({
      where,
      include: {
        designClothing: {
          include: {
            color: true, // Incluye detalles del color.
            size: true, // Incluye detalles de la talla.
            design: {
              include: {
                clothing: {
                  include: {
                    typeClothing: true, // Incluye el tipo de prenda.
                    category: true, // Incluye la categoría.
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Encuentra todos los productos sin filtros para administración desde el CMS.
   * Devuelve una vista enriquecida con nombres de relaciones.
   * @returns Una lista de todos los productos con detalles adicionales.
   */
  async findAllForAdmin() {
    const products = await this.prisma.product.findMany({
      include: {
        designClothing: {
          include: {
            color: true,
            size: true,
            design: {
              include: {
                clothing: true,
                collection: {
                  include: {
                    yearProduction: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Mapea el resultado para aplanar la estructura y añadir los nombres.
    return products.map((product) => {
      const { designClothing, ...restOfProduct } = product;
      return {
        ...restOfProduct,
        clothing_name: designClothing?.design?.clothing?.name ?? null,
        color_name: designClothing?.color?.name ?? null,
        size_name: designClothing?.size?.name ?? null,
        collection_name: designClothing?.design?.collection?.name ?? null,
        year_production:
          designClothing?.design?.collection?.yearProduction?.name ?? null,
      };
    });
  }

  /**
   * Encuentra todos los productos activos asociados a una referencia de diseño específica.
   * @param reference - La referencia del diseño a buscar.
   * @returns Una lista de productos que coinciden con la referencia.
   * @throws NotFoundException si no se encuentran productos para la referencia.
   */
  async findByDesignReference(
    reference: string,
  ): Promise<(Product & { designClothing: any })[]> {
    const products = await this.prisma.product.findMany({
      where: {
        designClothing: {
          design: {
            reference: reference,
          },
        },
        active: true, // Solo traer variantes activas
      },
      include: this.getProductWithDetails(),
    });

    if (!products || products.length === 0) {
      throw new NotFoundException(
        `No se encontraron productos para la referencia de diseño '${reference}'.`,
      );
    }
    return products;
  }

  /**
   * Encuentra un único producto por su ID.
   * @param id - El ID del producto a buscar.
   * @returns El producto encontrado con sus relaciones.
   * @throws NotFoundException si el producto no existe.
   */
  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        designClothing: {
          include: {
            color: true,
            size: true,
            design: {
              include: {
                clothing: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID #${id} no encontrado.`);
    }
    return product;
  }

  /**
   * Actualiza un producto existente.
   * @param id - El ID del producto a actualizar.
   * @param updateProductDto - DTO con los datos a actualizar.
   * @returns El producto actualizado.
   * @throws NotFoundException si el producto o el nuevo id_design_clothing no existen.
   */
  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const { id_design_clothing, ...productData } = updateProductDto;
    const dataToUpdate: Prisma.ProductUpdateInput = { ...productData };

    // Si se va a cambiar la variante de diseño, verificar que la nueva exista.
    if (id_design_clothing) {
      try {
        await this.prisma.designClothing.findUniqueOrThrow({
          where: { id: id_design_clothing },
        });
        dataToUpdate.designClothing = { connect: { id: id_design_clothing } };
      } catch (error) {
        throw new NotFoundException(
          `La nueva variante de diseño con ID #${id_design_clothing} no fue encontrada.`,
        );
      }
    }

    // Actualizar el producto y manejar el caso de que no se encuentre.
    try {
      return await this.prisma.product.update({
        where: { id },
        data: dataToUpdate,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Producto con ID #${id} no encontrado.`);
        }
      }
      throw error; // Re-lanza cualquier otro error
    }
  }

  /**
   * Elimina un producto de la base de datos.
   * @param id - El ID del producto a eliminar.
   * @returns El producto que fue eliminado.
   * @throws NotFoundException si el producto no existe.
   */
  async remove(id: number): Promise<Product> {
    // 1. Asegurarse de que el producto exista antes de eliminarlo.
    await this.findOne(id);

    // 2. Eliminar el producto.
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
