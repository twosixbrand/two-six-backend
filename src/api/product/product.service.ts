import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Gender, Prisma, Product } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) { }

  private readonly productWithDetails = {
    designClothing: {
      include: {
        color: true,
        size: true,
        design: {
          select: {
            description: true,
            clothing: {
              select: {
                name: true,
                gender: true,
                typeClothing: true, // Mantenemos las relaciones anidadas
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
   * Genera un SKU único basado en las relaciones de una variante de diseño.
   * @param designClothingId - El ID de la variante de diseño.
   * @returns El SKU generado.
   * @throws NotFoundException si alguna de las entidades relacionadas no existe.
   */
  private async _generateSku(designClothingId: number): Promise<string> {
    const designClothing = await this.prisma.designClothing.findUnique({
      where: { id: designClothingId },
      include: {
        design: true,
        color: true,
        size: true,
      },
    });

    if (!designClothing?.design || !designClothing.color || !designClothing.size) {
      throw new NotFoundException(
        `No se pudieron encontrar los detalles completos (diseño, color, talla) para la variante con ID #${designClothingId}.`,
      );
    }

    const { design, color, size } = designClothing;

    const referencePart = design.reference;
    const colorPart = color.name.substring(0, 3).toUpperCase();
    const sizePart = size.name.toUpperCase();

    const sku = `${referencePart}-${colorPart}-${sizePart}`;

    return sku;
  }

  /**
   * Crea un nuevo producto en la base de datos.
   * @param createProductDto - DTO con los datos para crear el producto.
   * @returns El producto creado.
   * @throws NotFoundException si el id_design_clothing no existe.
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { id_design_clothing, ...productData } = createProductDto;

    // 1. Generar el SKU a partir del id_design_clothing.
    // La función _generateSku ya valida la existencia de la variante y sus relaciones.
    const generatedSku = await this._generateSku(id_design_clothing);

    // 2. Crear el producto con el SKU generado.
    return this.prisma.product.create({
      data: {
        ...productData,
        sku: generatedSku,
        // Asignar valores por defecto si no vienen en el DTO.
        active: productData.active ?? true, // Mantenido
        is_outlet: productData.is_outlet ?? false, // Corregido de 'outlet' a 'is_outlet'
        designClothing: {
          connect: {
            id: id_design_clothing,
          },
        },
      },
      include: this.getProductWithDetails(),
    });
  }

  /**
   * Helper para mapear la estructura anidada a un objeto plano con nombre y descripción.
   */
  private _mapProduct(product: any) {
    return {
      ...product,
      name: product.designClothing?.design?.clothing?.name || "Producto sin nombre",
      description: product.designClothing?.design?.description || "",
    };
  }

  /**
   * Encuentra todos los productos, con filtros opcionales por género y si es outlet.
   * Devuelve una vista enriquecida del producto con sus relaciones.
   * @param gender - Género para filtrar los productos (opcional).
   * @param is_outlet - Booleano para filtrar si el producto es outlet (opcional).
   */
  async findAll(gender?: Gender, is_outlet?: boolean) {
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

    const products = await this.prisma.product.findMany({
      where,
      include: this.getProductWithDetails(), // Incluir relaciones en la respuesta
    });

    return products.map(p => this._mapProduct(p));
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
        name: designClothing?.design?.clothing?.name || "Producto sin nombre", // Added for consistency
        clothing_name: designClothing?.design?.clothing?.name ?? null,
        color_name: designClothing?.color?.name ?? null,
        description: designClothing?.design?.description ?? null,
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
    return products.map(p => this._mapProduct(p));
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
    return this._mapProduct(product);
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

    // Si se va a cambiar la variante de diseño, generar un nuevo SKU.
    if (id_design_clothing) {
      // La función _generateSku valida la existencia de la nueva variante.
      const newSku = await this._generateSku(id_design_clothing);
      dataToUpdate.sku = newSku;
      dataToUpdate.designClothing = { connect: { id: id_design_clothing } };
    }

    // Asegurarse de que el producto a actualizar existe.
    await this.prisma.product.findUniqueOrThrow({
      where: { id },
    });

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
