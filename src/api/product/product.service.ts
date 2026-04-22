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


  async findDesignsForStore(gender?: string, is_outlet?: boolean, category?: string, tag?: string, page: number = 1, limit: number = 12) {
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
      ...((gender || category) && {
        clothing: {
          ...(gender && {
            gender: {
              name: gender
            }
          }),
          ...(category && {
            OR: [
              { category: { name: { contains: category, mode: 'insensitive' } } },
              { typeClothing: { name: { contains: category, mode: 'insensitive' } } }
            ]
          })
        }
      }),
      ...(tag && {
        designTags: {
          some: {
            tag: {
              slug: tag
            }
          }
        }
      })
    };

    const total = await this.prisma.design.count({ where });
    const skip = (page - 1) * limit;

    const designs = await this.prisma.design.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: 'desc' }, // Recommend ordering by latest
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
    const finalDesigns = designs.map(design => {
      // Flatten all products from all colors/sizes to find a representative one
      let validProduct: any = null;
      let validImage: string | null = null;
      let validClothingColor: any = null;

      for (const cc of design.clothingColors) {
        for (const cs of cc.clothingSizes) {
          if (cs.product && cs.product.active && cs.product.clothingSize.quantity_available > 0) {
            validProduct = cs.product;
            // Sort by position asc, take first
            const images = [...(cc.imageClothing || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
            validImage = images.length > 0 ? images[0].image_url : null;
            validClothingColor = cc;
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
              validClothingColor = cc;
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
        slug: validClothingColor?.slug,
        price: validProduct?.price,
        image_url: design.image_url || validImage,
        is_outlet: validProduct?.is_outlet,
        gender: design.clothing.gender?.name || 'Unisex' // Single gender now
      };
    }).filter(d => d.id_product); // Ensure we only return items that resolved to a product

    const totalPages = Math.ceil(total / limit);

    return {
      data: finalDesigns,
      meta: {
        total,
        page,
        totalPages,
        limit
      }
    };
  }

  /**
   * Returns all active, non-outlet products in a flat structure
   * optimized for Google Merchant Center feed generation.
   */
  async findAllForGoogleFeed() {
    const products = await this.prisma.product.findMany({
      where: {
        active: true,
        is_outlet: false,
      },
      include: {
        clothingSize: {
          include: {
            size: true,
            clothingColor: {
              include: {
                color: true,
                imageClothing: {
                  orderBy: { position: 'asc' },
                },
                design: {
                  include: {
                    clothing: {
                      include: {
                        gender: true,
                        typeClothing: true,
                        category: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return products.map((product) => {
      const cs = product.clothingSize;
      const cc = cs?.clothingColor;
      const design = cc?.design;
      const clothing = design?.clothing;
      const images = cc?.imageClothing || [];

      return {
        id: product.id,
        sku: product.sku || `TS-${product.id}`,
        price: product.price,
        discount_price: product.discount_price,
        discount_percentage: product.discount_percentage,
        active: product.active,
        quantity_available: cs?.quantity_available || 0,
        slug: cc?.slug || null,
        color_name: cc?.color?.name || null,
        size_name: cs?.size?.name || null,
        design_reference: design?.reference || null,
        design_description: design?.description || null,
        clothing_name: clothing?.name || 'Producto Two Six',
        gender_name: clothing?.gender?.name || 'Unisex',
        type_clothing_name: clothing?.typeClothing?.name || null,
        category_name: clothing?.category?.name || null,
        image_url: images[0]?.image_url || design?.image_url || null,
        additional_images: images.slice(1, 11).map((img) => img.image_url).filter(Boolean),
      };
    });
  }

  /** escape special characters for XML */
  private escapeXml(str: string | null | undefined): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /** map gender for feeds */
  private mapGender(genderName: string): string {
    const normalized = (genderName || '').toLowerCase().trim();
    if (normalized === 'masculino' || normalized === 'male') return 'male';
    if (normalized === 'femenino' || normalized === 'female') return 'female';
    return 'unisex';
  }

  /**
   * Generates Facebook Meta Business Manager XML Feed directly from the database
   */
  async getFacebookFeedXml(baseUrl: string = 'https://twosixweb.com'): Promise<string> {
    const products = await this.findAllForGoogleFeed();
    const validProducts = products.filter(p => p.image_url); // images are required

    const TYPE_TO_CATEGORY: Record<string, string> = {
      'camiseta': '212',
      'polo': '212',
      'camisa': '212',
      'buso': '5388',
      'chaqueta': '3066',
      'pantalon largo': '204',
      'jean': '204',
      'pantalon corto': '207',
      'calzado': '187',
      'gorra': '173',
      'vestido': '2271',
    };

    const itemsXml = validProducts.map(p => {
      const productUrl = p.slug ? `${baseUrl}/product/${p.slug}` : `${baseUrl}/product/${p.id}`;
      const availability = p.quantity_available > 0 ? 'in_stock' : 'out_of_stock';
      
      const titleParts = [p.clothing_name];
      if (p.color_name) titleParts.push(p.color_name);
      if (p.size_name) titleParts.push(p.size_name);
      const title = titleParts.join(' - ');

      const description = p.design_description || `${p.clothing_name} de Two Six. Ropa colombiana con estilo y confort.`;
      const priceFormatted = `${Number(p.price).toFixed(2)} COP`;
      const salePriceLine = p.discount_price ? `      <g:sale_price>${Number(p.discount_price).toFixed(2)} COP</g:sale_price>\n` : '';
      
      const typeKey = (p.type_clothing_name || '').toLowerCase().trim();
      const googleCategory = TYPE_TO_CATEGORY[typeKey] || '1604';

      const additionalImageLines = p.additional_images
        .map(url => `      <g:additional_image_link>${this.escapeXml(url)}</g:additional_image_link>`)
        .join('\n');

      return `    <item>
      <g:id>${this.escapeXml(p.sku)}</g:id>
      <g:title>${this.escapeXml(title)}</g:title>
      <g:description>${this.escapeXml(description)}</g:description>
      <g:link>${this.escapeXml(productUrl)}</g:link>
      <g:image_link>${this.escapeXml(p.image_url)}</g:image_link>
${additionalImageLines ? additionalImageLines + '\n' : ''}      <g:availability>${availability}</g:availability>
      <g:price>${priceFormatted}</g:price>
${salePriceLine}      <g:brand>Two Six</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>false</g:identifier_exists>
      <g:item_group_id>${this.escapeXml(p.design_reference || String(p.id))}</g:item_group_id>
${p.color_name ? `      <g:color>${this.escapeXml(p.color_name)}</g:color>\n` : ''}${p.size_name ? `      <g:size>${this.escapeXml(p.size_name)}</g:size>\n` : ''}      <g:gender>${this.mapGender(p.gender_name)}</g:gender>
      <g:age_group>adult</g:age_group>
      <g:google_product_category>${googleCategory}</g:google_product_category>
    </item>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Two Six - Facebook Catalog Feed</title>
    <link>${baseUrl}</link>
    <description>Catálogo de Productos para Meta Business Manager</description>
${itemsXml}
  </channel>
</rss>`;
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
                imageClothing: {
                  orderBy: { position: 'asc' },
                },
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
      
      const images = clothingColor?.imageClothing || [];
      const image_url = images.length > 0 ? images[0].image_url : (clothingColor?.design?.image_url || null);

      return {
        ...restOfProduct,
        image_url: image_url,
        name: clothingColor?.design?.clothing?.name || "Producto sin nombre",
        clothing_name: clothingColor?.design?.clothing?.name ?? null,
        color_name: clothingColor?.color?.name ?? null,
        description: clothingColor?.design?.description ?? null,
        size_name: clothingSize?.size?.name ?? null,
        collection_name: clothingColor?.design?.collection?.name ?? null,
        year_production: clothingColor?.design?.collection?.yearProduction?.name ?? null,
        gender: clothingColor?.design?.clothing?.gender?.name ?? null,
        quantity_available: clothingSize?.quantity_available ?? 0,
        quantity_on_consignment: clothingSize?.quantity_on_consignment ?? 0,
        reference: clothingColor?.design?.reference ?? null,
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

  async findByClothingColorSlug(
    slug: string,
  ): Promise<{ products: (Product & { clothingSize: any })[], colorId: number | null }> {
    const clothingColor = await this.prisma.clothingColor.findUnique({
      where: { slug: slug },
      include: {
        design: true
      }
    });

    if (!clothingColor) {
        throw new NotFoundException(`No se encontró un color de variante con el slug '${slug}'.`);
    }

    const reference = clothingColor.design.reference;

    // Get all products from the same design (so the user can switch sizes and other colors in frontend)
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
        `No se encontraron productos activos para la referencia de diseño '${reference}'.`,
      );
    }

    return {
       products: products.map(p => this._mapProduct(p)),
       colorId: clothingColor.id_color
    };
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
