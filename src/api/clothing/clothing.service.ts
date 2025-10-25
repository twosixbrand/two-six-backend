import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClothingDto } from './dto/create-clothing.dto';
import { UpdateClothingDto } from './dto/update-clothing.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ClothingService {
  constructor(private readonly prisma: PrismaService) {}

  create(createClothingDto: CreateClothingDto) {
    return this.prisma.clothing.create({ data: createClothingDto });
  }

  findAll() {
    return this.prisma.clothing.findMany();
  }

  async findOne(id: string) {
    const clothing = await this.prisma.clothing.findUnique({ where: { id } });
    if (!clothing) {
      throw new NotFoundException(`Clothing with ID #${id} not found`);
    }
    return clothing;
  }

  async update(id: string, updateClothingDto: UpdateClothingDto) {
    await this.findOne(id);
    return this.prisma.clothing.update({ where: { id }, data: updateClothingDto });
  }

  remove(id: string) {
    return this.prisma.clothing.delete({ where: { id } });
  }
}
