import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as path from 'path';
import { ImageClothing } from '@prisma/client';

@Injectable()
export class ImageClothingService {
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

    async uploadImages(files: Express.Multer.File[], id_clothing_color: number) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files uploaded');
        }

        const clothingColor = await this.prisma.clothingColor.findUnique({
            where: { id: id_clothing_color },
            include: {
                design: {
                    include: {
                        clothing: { include: { category: true, gender: true } },
                        collection: true,
                    }
                },
                color: true,
            }
        });

        if (!clothingColor) throw new NotFoundException('ClothingColor not found');

        const genderName = clothingColor.design.clothing.gender?.name || 'UNISEX';

        // Generate Path Logic
        const sanitize = (text: string) =>
            text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/-+$/, '').replace(/-+$/, '');

        const categorySlug = sanitize(clothingColor.design.clothing.category.name);
        const collectionSlug = sanitize(clothingColor.design.collection.name);
        const productSlug = sanitize(clothingColor.design.reference);
        const colorSlug = sanitize(clothingColor.color.name);
        // Use derived gender slug
        const genderSlug = sanitize(genderName);

        const bucket = this.bucketName;
        const endpointHost = this.s3Endpoint.replace(/^https?:\/\//, '');
        const uploadedImages: ImageClothing[] = [];

        // Determine starting position
        const lastImage = await this.prisma.imageClothing.findFirst({
            where: { id_clothing_color },
            orderBy: { position: 'desc' }
        });
        let startPosition = (lastImage?.position || 0) + 1;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const uniqueId = Date.now() + i;
            // Assuming we still want gender in path? Yes, probably.
            const fileSlug = `${productSlug}-${colorSlug}-${genderSlug}-${uniqueId}`;
            const extension = path.parse(file.originalname).ext;
            const envName = process.env.ENVIRONMENT_NAME || 'DLLO';
            const key = `${envName}/${categorySlug}/${collectionSlug}/${productSlug}/${colorSlug}/${genderSlug}/${fileSlug}${extension}`;

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
                const imageUrl = `https://${bucket}.${endpointHost}/${key}`;

                const imageRecord = await this.prisma.imageClothing.create({
                    data: {
                        id_clothing_color,
                        image_url: imageUrl,
                        position: startPosition + i
                    }
                });
                uploadedImages.push(imageRecord);
            } catch (error) {
                console.error('Upload Error:', error);
            }
        }
        return uploadedImages;
    }

    async findAll(id_clothing_color: number) {
        return this.prisma.imageClothing.findMany({
            where: { id_clothing_color },
            orderBy: { position: 'asc' }
        });
    }

    async remove(id: number) {
        const image = await this.prisma.imageClothing.findUnique({ where: { id_image_clothing: id } });
        if (!image) throw new NotFoundException('Image not found');

        // Delete from S3
        if (image.image_url) {
            try {
                const urlObj = new URL(image.image_url);
                const key = urlObj.pathname.substring(1);

                await this.s3Client.send(new DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: key
                }));
            } catch (e) {
                console.warn('Failed to delete from S3', e);
            }
        }

        // Delete DB record
        await this.prisma.imageClothing.delete({ where: { id_image_clothing: id } });

        // Shift positions for remaining images
        await this.prisma.imageClothing.updateMany({
            where: {
                id_clothing_color: image.id_clothing_color,
                position: { gt: image.position }
            },
            data: {
                position: { decrement: 1 }
            }
        });

        return { message: 'Image deleted successfully' };
    }

    async reorder(id_clothing_color: number, imageIds: number[]) {
        // We use a transaction to ensure all updates succeed or fail together
        return await this.prisma.$transaction(
            imageIds.map((id, index) =>
                this.prisma.imageClothing.update({
                    where: { id_image_clothing: id, id_clothing_color }, // Ensure it belongs to the same parent
                    data: { position: index + 1 }
                })
            )
        );
    }
}
