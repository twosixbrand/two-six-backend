import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateClothingColorDto } from './dto/create-clothing-color.dto';
import { UpdateClothingColorDto } from './dto/update-clothing-color.dto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as path from 'path';

@Injectable()
export class ClothingColorService {
  private s3Client: S3Client;
  private readonly bucketName: string;
  private readonly s3Endpoint: string;

  constructor(private readonly prisma: PrismaService) {
    this.bucketName = process.env.DO_SPACES_BUCKET || 'two-six';
    const rawEndpoint = process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com';
    this.s3Endpoint = rawEndpoint.replace(`${this.bucketName}.`, '');

    this.s3Client = new S3Client({
      endpoint: this.s3Endpoint,
      region: process.env.DO_SPACES_REGION,
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY || '',
        secretAccessKey: process.env.DO_SPACES_SECRET || '',
      },
      forcePathStyle: false,
    });
  }

  create(createClothingColorDto: CreateClothingColorDto) {
    return this.prisma.clothingColor.create({
      data: createClothingColorDto,
    });
  }

  async createContextual(
    file: Express.Multer.File,
    id_design: number,
    id_color: number,
    sizes: { id_size: number; quantity_produced: number; quantity_available: number }[]
  ) {
    try {
      if (!file) {
        throw new BadRequestException('Image file is required');
      }

      console.log('createContextual called with:', {
        filename: file.originalname,
        id_design,
        id_color,
        sizesCount: sizes?.length
      });

      if (!process.env.DO_SPACES_KEY || !process.env.DO_SPACES_SECRET) {
        console.error('Missing DO_SPACES credentials');
        throw new BadRequestException('Server misconfiguration: Missing Storage Credentials');
      }

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
      if (!design.clothing.category) throw new BadRequestException('Clothing has no category');
      if (!design.collection) throw new BadRequestException('Design has no collection');

      const color = await this.prisma.color.findUnique({ where: { id: id_color } });
      if (!color) throw new NotFoundException('Color not found');

      // 2. Generate Path
      const sanitize = (text: string) =>
        text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');

      const categorySlug = sanitize(design.clothing.category.name);
      const collectionSlug = sanitize(design.collection.name);
      const productSlug = sanitize(design.reference);
      const colorSlug = sanitize(color.name);

      const fileSlug = `${productSlug}-${colorSlug}`;
      const extension = path.parse(file.originalname).ext;
      const envName = process.env.ENVIRONMENT_NAME || 'DLLO';
      const key = `${envName}/${categorySlug}/${collectionSlug}/${productSlug}/${colorSlug}/${fileSlug}${extension}`;
      const bucket = this.bucketName;

      // 3. Upload
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: file.buffer,
            ACL: 'public-read',
            ContentType: file.mimetype,
          }),
        );
      } catch (s3Error) {
        console.error('S3 Upload Error:', s3Error);
        throw new BadRequestException(`Failed to upload image to ${bucket}: ${s3Error.message}`);
      }

      const endpointHost = this.s3Endpoint.replace(/^https?:\/\//, '');
      const imageUrl = `https://${bucket}.${endpointHost}/${key}`;

      // 4. Create Database Records (Parent + Children)
      const result = await this.prisma.$transaction(async (tx) => {
        // Create Parent (ClothingColor)
        const clothingColor = await tx.clothingColor.create({
          data: {
            id_design,
            id_color,
            image_url: imageUrl,
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
