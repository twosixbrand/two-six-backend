import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMasterDesignDto } from './dto/create-master-design.dto';
import { UpdateMasterDesignDto } from './dto/update-master-design.dto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as path from 'path';

@Injectable()
export class MasterDesignService {
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

  private async uploadImage(file: Express.Multer.File, designId: number): Promise<string> {
    const extension = path.parse(file.originalname).ext;
    const envName = process.env.ENVIRONMENT_NAME || 'DLLO';
    // Path: ENVIRONMENT_NAME / 'Design' / idDesign / 'idDesign-' + idDesign + '.' + extension
    const key = `${envName}/Design/${designId}/idDesign-${designId}${extension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ACL: 'public-read',
          ContentType: file.mimetype,
        }),
      );
      const endpointHost = this.s3Endpoint.replace(/^https?:\/\//, '');
      return `https://${this.bucketName}.${endpointHost}/${key}`;
    } catch (error) {
      console.error('Upload Error:', error);
      throw new BadRequestException('Error uploading image');
    }
  }

  async create(createMasterDesignDto: CreateMasterDesignDto, file?: Express.Multer.File) {
    // Usamos una transacción para asegurar la atomicidad de la operación.
    return this.prisma.$transaction(async (prisma) => {
      // 1. Crea el diseño con una referencia temporal para obtener su ID.
      const design = await prisma.design.create({
        data: {
          ...createMasterDesignDto,
          id_clothing: Number(createMasterDesignDto.id_clothing),
          id_collection: Number(createMasterDesignDto.id_collection),
          manufactured_cost: Number(createMasterDesignDto.manufactured_cost),
          reference: 'temp', // Valor temporal
        },
      });

      // 2. Construye la referencia usando el ID del nuevo diseño.
      const reference = await this.buildReference(
        design.id,
        design.id_collection,
        design.id_clothing,
      );

      let imageUrl: string | null = null;
      if (file) {
        // No podemos usar `this.uploadImage` dentro de la transacción si dependemos de que falle la transacción si falla el upload,
        // pero el upload es externo. Lo haremos, si falla lanzamos error y la transacción se revierte.
        imageUrl = await this.uploadImage(file, design.id);
      }

      // 3. Actualiza el diseño con la referencia correcta y la imagen.
      return prisma.design.update({
        where: { id: design.id },
        data: {
          reference,
          ...(imageUrl ? { image_url: imageUrl } : {}),
        },
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
        clothing: {
          include: {
            gender: true
          }
        },
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
        clothing: {
          include: {
            gender: true
          }
        },
      },
    });
    if (!design) {
      throw new NotFoundException(`Diseño con ID #${id} no encontrado.`);
    }
    return design;
  }

  async update(id: number, updateMasterDesignDto: UpdateMasterDesignDto, file?: Express.Multer.File) {
    await this.findOne(id);

    const shouldRecalculateReference =
      updateMasterDesignDto.id_collection ||
      updateMasterDesignDto.id_clothing;

    let dataToUpdate: any = {
      ...updateMasterDesignDto,
    };

    // Convert strings to numbers if they come from FormData
    if (dataToUpdate.id_clothing) dataToUpdate.id_clothing = Number(dataToUpdate.id_clothing);
    if (dataToUpdate.id_collection) dataToUpdate.id_collection = Number(dataToUpdate.id_collection);
    if (dataToUpdate.manufactured_cost) dataToUpdate.manufactured_cost = Number(dataToUpdate.manufactured_cost);


    if (file) {
      const imageUrl = await this.uploadImage(file, id);
      dataToUpdate.image_url = imageUrl;
    }

    // Si no se necesita recalcular, simplemente actualizamos.
    if (!shouldRecalculateReference) {
      return this.prisma.design.update({
        where: { id },
        data: dataToUpdate,
      });
    }

    // Si se necesita recalcular, actualizamos los datos y luego la referencia.
    const updatedDesign = await this.prisma.design.update({
      where: { id },
      data: dataToUpdate,
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
