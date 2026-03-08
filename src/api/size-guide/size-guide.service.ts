import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSizeGuideDto } from './dto/create-size-guide.dto';
import { UpdateSizeGuideDto } from './dto/update-size-guide.dto';

@Injectable()
export class SizeGuideService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createSizeGuideDto: CreateSizeGuideDto) {
        return this.prisma.sizeGuide.create({
            data: createSizeGuideDto,
        });
    }

    async findAll() {
        return this.prisma.sizeGuide.findMany({
            orderBy: { id: 'asc' },
        });
    }

    async findOne(id: number) {
        const guide = await this.prisma.sizeGuide.findUnique({
            where: { id },
        });
        if (!guide) {
            throw new NotFoundException(`Size guide with ID ${id} not found`);
        }
        return guide;
    }

    async update(id: number, updateSizeGuideDto: UpdateSizeGuideDto) {
        // Ensure it exists first
        await this.findOne(id);

        return this.prisma.sizeGuide.update({
            where: { id },
            data: updateSizeGuideDto,
        });
    }

    async remove(id: number) {
        // Ensure it exists first
        await this.findOne(id);

        return this.prisma.sizeGuide.delete({
            where: { id },
        });
    }
}

