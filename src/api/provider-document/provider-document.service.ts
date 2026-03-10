import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as path from 'path';

@Injectable()
export class ProviderDocumentService {
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

    async uploadDocument(
        file: Express.Multer.File,
        providerId: string,
        documentType: string,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const validTypes = ['RUT', 'CAMARA_COMERCIO', 'CEDULA_REP_LEGAL', 'CERT_BANCARIO', 'OTROS'];
        if (!validTypes.includes(documentType)) {
            throw new BadRequestException(`Invalid document type. Must be one of: ${validTypes.join(', ')}`);
        }

        // Verify provider exists
        const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
        if (!provider) {
            throw new NotFoundException(`Provider with NIT ${providerId} not found`);
        }

        // If it's not OTROS, delete existing document of the same type (replace)
        if (documentType !== 'OTROS') {
            const existing = await this.prisma.providerDocument.findFirst({
                where: { provider_id: providerId, document_type: documentType },
            });
            if (existing) {
                await this.removeDocument(existing.id);
            }
        }

        const sanitize = (text: string) =>
            text.toString().toLowerCase().normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/-+$/g, '');

        const uniqueId = Date.now();
        const extension = path.parse(file.originalname).ext;
        const envName = process.env.ENVIRONMENT_NAME || 'DLLO';
        const providerSlug = sanitize(providerId);
        const typeSlug = sanitize(documentType);
        const key = `${envName}/providers/${providerSlug}/${typeSlug}/${typeSlug}-${uniqueId}${extension}`;

        const bucket = this.bucketName;
        const endpointHost = this.s3Endpoint.replace(/^https?:\/\//, '');

        await this.s3Client.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: file.buffer,
                ACL: 'public-read',
                ContentType: file.mimetype,
            }),
        );

        const fileUrl = `https://${bucket}.${endpointHost}/${key}`;

        return this.prisma.providerDocument.create({
            data: {
                provider_id: providerId,
                document_type: documentType,
                file_url: fileUrl,
                file_name: file.originalname,
            },
        });
    }

    async findAllByProvider(providerId: string) {
        return this.prisma.providerDocument.findMany({
            where: { provider_id: providerId },
            orderBy: { uploaded_at: 'desc' },
        });
    }

    async removeDocument(id: number) {
        const doc = await this.prisma.providerDocument.findUnique({ where: { id } });
        if (!doc) throw new NotFoundException('Document not found');

        // Delete from S3
        if (doc.file_url) {
            try {
                const urlObj = new URL(doc.file_url);
                const key = urlObj.pathname.substring(1);
                await this.s3Client.send(new DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                }));
            } catch (e) {
                console.warn('Failed to delete document from S3', e);
            }
        }

        await this.prisma.providerDocument.delete({ where: { id } });
        return { message: 'Document deleted successfully' };
    }
}
