import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Gender, Prisma, Product } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) { }

  private readonly productWithDetails = {
    clothingSize: {
      include: {
        size: true,
        clothingColor: {
          include: {
            color: true,
            design: {
              include: {
                clothing: {
                  include: {
                    gender: true,
                  }
                }
              }
            },
            imageClothing: true,
          }
        }
      }
    }
  };

  private getProductWithDetails() {
    return this.productWithDetails;
  }

  private async _generateSku(clothingSizeId: number): Promise<string> {
    const clothingSize = await this.prisma.clothingSize.findUnique({
      where: { id: clothingSizeId },
      include: {
        size: true,
        clothingColor: {
          include: {
            design: true,
            color: true,
          }
        }
      },
    });

    if (!clothingSize?.size || !clothingSize.clothingColor?.design || !clothingSize.clothingColor?.color) {
      throw new NotFoundException(
        `No se pudieron encontrar los detalles completos (diseño, color, talla) para la variante de talla con ID #${clothingSizeId}.`,
      );
    }

    const { size, clothingColor: { design, color } } = clothingSize;

    const referencePart = design.reference;
    const colorPart = color.name.substring(0, 3).toUpperCase();
    const sizePart = size.name.toUpperCase();

    const sku = `${referencePart}-${colorPart}-${sizePart}`;

    return sku;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { id_clothing_size, ...productData } = createProductDto;

    const generatedSku = await this._generateSku(id_clothing_size);

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...productData,
          sku: generatedSku,
          active: productData.active ?? true,
          is_outlet: productData.is_outlet ?? false,
          clothingSize: {
            connect: {
              id: id_clothing_size,
            },
          },
        },
        include: this.getProductWithDetails(),
      });

      return product;
    });
  }

  private _mapProduct(product: any) {
    const clothing = product.clothingSize?.clothingColor?.design?.clothing;

    // Direct gender access
    // if (clothing && !clothing.gender && clothing.genderClothing && clothing.genderClothing.length > 0) {
    //   clothing.gender = clothing.genderClothing[0].gender.name;
    // }

    return {
      ...product,
      name: clothing?.name || "Producto sin nombre",
      description: product.clothingSize?.clothingColor?.design?.description || "",
      image_url: product.clothingSize?.clothingColor?.imageClothing?.[0]?.image_url || product.clothingSize?.clothingColor?.design?.image_url || "",
      designClothing: undefined,
      gender: clothing?.gender?.name || "Unisex"
    };
  }


  async findDesignsForStore(gender?: string, is_outlet?: boolean) {
    const where: Prisma.DesignWhereInput = {
      clothingColors: {
        some: {
          clothingSizes: {
            some: {
              product: {
                active: true,
                ...(is_outlet !== undefined && { is_outlet: is_outlet })
              },
              quantity_available: {
                gt: 0
              }
            }
          }
        }
      },
      ...(gender && {
        clothing: {
          gender: {
            name: gender
          }
        }
      })
    };

    const designs = await this.prisma.design.findMany({
      where,
      include: {
        clothing: {
          select: {
            name: true,
            gender: true,
          }
        },
        clothingColors: {
          include: {
            imageClothing: true,
            clothingSizes: {
              include: {
                product: {
                  where: {
                    active: true,
                    ...(is_outlet !== undefined && { is_outlet: is_outlet })
                  },
                  select: {
                    id: true,
                    price: true,
                    is_outlet: true,
                    active: true,
                    clothingSize: {
                      select: { quantity_available: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Map to a cleaner structure for the store
    // We need to pick one "main" image and price to show on the card.
    // Logic: Find the first product that is active and has stock.
    return designs.map(design => {
      // Flatten all products from all colors/sizes to find a representative one
      let validProduct: any = null;
      let validImage: string | null = null;

      for (const cc of design.clothingColors) {
        for (const cs of cc.clothingSizes) {
          if (cs.product && cs.product.active && cs.product.clothingSize.quantity_available > 0) {
            validProduct = cs.product;
            // Sort by position asc, take first
            const images = [...(cc.imageClothing || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
            validImage = images.length > 0 ? images[0].image_url : null;
            break;
          }
        }
        if (validProduct) break;
      }

      // Fallback: if no product with stock > 0 found (shouldn't happen due to query filter, but safety check)
      if (!validProduct) {
        // Fallback to just finding an active product regardless of stock if query slipped
        for (const cc of design.clothingColors) {
          for (const cs of cc.clothingSizes) {
            if (cs.product && cs.product.active) {
              validProduct = cs.product;
              const images = [...(cc.imageClothing || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
              validImage = images.length > 0 ? images[0].image_url : null;
              break;
            }
          }
          if (validProduct) break;
        }
      }


      return {
        id_design: design.id,
        name: design.clothing.name,
        description: design.description,
        // We return the ID of the product so the card can link to /product/:id
        id_product: validProduct?.id,
        price: validProduct?.price,
        image_url: design.image_url || validImage,
        is_outlet: validProduct?.is_outlet,
        gender: design.clothing.gender?.name || 'Unisex' // Single gender now
      };
    }).filter(d => d.id_product); // Ensure we only return items that resolved to a product
  }

  async findAll(gender?: string, is_outlet?: boolean) {
    const where: Prisma.ProductWhereInput = {
      active: true,
    };

    if (is_outlet !== undefined) {
      where.is_outlet = is_outlet;
    }

    if (gender) {
      where.clothingSize = {
        clothingColor: {
          design: {
            clothing: {
              gender: {
                name: gender
              }
            },
          },
        }
      };
    }

    const products = await this.prisma.product.findMany({
      where,
      include: this.getProductWithDetails(),
    });

    return products.map(p => this._mapProduct(p));
  }

  async findAllForAdmin() {
    const products = await this.prisma.product.findMany({
      include: {
        clothingSize: {
          include: {
            size: true,
            clothingColor: {
              include: {
                color: true,
                design: {
                  include: {
                    clothing: {
                      include: {
                        gender: true
                      }
                    },
                    collection: {
                      include: {
                        yearProduction: true,
                      },
                    },
                  }
                }
              }
            }
          }
        },
      },
    });

    return products.map((product) => {
      const { clothingSize, ...restOfProduct } = product;
      const clothingColor = clothingSize?.clothingColor;
      return {
        ...restOfProduct,
        name: clothingColor?.design?.clothing?.name || "Producto sin nombre",
        clothing_name: clothingColor?.design?.clothing?.name ?? null,
        color_name: clothingColor?.color?.name ?? null,
        description: clothingColor?.design?.description ?? null,
        size_name: clothingSize?.size?.name ?? null,
        collection_name: clothingColor?.design?.collection?.name ?? null,
        year_production: clothingColor?.design?.collection?.yearProduction?.name ?? null,
        gender: clothingColor?.design?.clothing?.gender?.name ?? null,
      };
    });
  }

  async findByDesignReference(
    reference: string,
  ): Promise<(Product & { clothingSize: any })[]> {
    const products = await this.prisma.product.findMany({
      where: {
        clothingSize: {
          clothingColor: {
            design: {
              reference: reference
            }
          }
        },
        active: true,
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

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: this.getProductWithDetails(),
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID #${id} no encontrado.`);
    }
    return this._mapProduct(product);
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const { id_clothing_size, ...productData } = updateProductDto;
    const dataToUpdate: Prisma.ProductUpdateInput = { ...productData };

    if (id_clothing_size) {
      const newSku = await this._generateSku(id_clothing_size);
      dataToUpdate.sku = newSku;
      dataToUpdate.clothingSize = { connect: { id: id_clothing_size } };
    }

    await this.prisma.product.findUniqueOrThrow({
      where: { id },
    });

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
      throw error;
    }
  }

  async remove(id: number): Promise<Product> {
    await this.findOne(id);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const productToDelete = await tx.product.findUnique({
          where: { id },
          select: { id_clothing_size: true }
        });

        return await tx.product.delete({
          where: { id },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException(
            `No se puede eliminar el producto porque tiene registros relacionados.`
          );
        }
      }
      throw error;
    }
  }
}
