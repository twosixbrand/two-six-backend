import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClothingSizeDto } from './dto/create-clothing-size.dto';
import { UpdateClothingSizeDto } from './dto/update-clothing-size.dto';

@Injectable()
export class ClothingSizeService {
    constructor(private readonly prisma: PrismaService) { }

    create(createClothingSizeDto: CreateClothingSizeDto) {
        return this.prisma.clothingSize.create({
            data: {
                ...createClothingSizeDto,
                quantity_sold: createClothingSizeDto.quantity_sold ?? 0,
                quantity_on_consignment: createClothingSizeDto.quantity_on_consignment ?? 0,
                quantity_under_warranty: createClothingSizeDto.quantity_under_warranty ?? 0,
            },
        });
    }

    findAll() {
        return this.prisma.clothingSize.findMany({
            include: {
                clothingColor: {
                    include: {
                        color: true,
                        design: {
                            include: {
                                clothing: true
                            }
                        }
                    }
                },
                size: true,
            },
        });
    }

    async findOne(id: number) {
        const clothingSize = await this.prisma.clothingSize.findUnique({
            where: { id },
            include: {
                clothingColor: true,
                size: true,
            },
        });
        if (!clothingSize) {
            throw new NotFoundException(`ClothingSize with ID "${id}" not found`);
        }
        return clothingSize;
    }

    async update(id: number, updateClothingSizeDto: UpdateClothingSizeDto) {
        await this.findOne(id);
        return this.prisma.clothingSize.update({
            where: { id },
            data: updateClothingSizeDto,
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        // Check for stocks/products before deleting?
        // If cascade is not set, we might need checks.
        // For now, simple delete.
        return this.prisma.clothingSize.delete({
            where: { id },
        });
    }
}
