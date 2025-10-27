import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTypeClothingDto } from './dto/create-type-clothing.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TypeClothingService {
  constructor(private readonly prisma: PrismaService) {}

  create(createTypeClothingDto: CreateTypeClothingDto) {
    return this.prisma.type_Clothing.create({ data: createTypeClothingDto });
  }

  findAll() {
    return this.prisma.type_Clothing.findMany();
  }

  async findOne(id: string) {
    const typeClothing = await this.prisma.type_Clothing.findUnique({
      where: { code: id },
    });

    if (!typeClothing) {
      throw new NotFoundException(`TypeClothing with ID #${id} not found`);
    }

    return typeClothing;
  }
}
