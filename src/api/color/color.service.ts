import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';

@Injectable()
export class ColorService {
  constructor(private prisma: PrismaService) {}

  create(createColorDto: CreateColorDto) {
    return this.prisma.color.create({
      data: createColorDto,
    });
  }

  findAll() {
    return this.prisma.color.findMany();
  }

  findOne(id: number) {
    return this.prisma.color.findUnique({
      where: { id },
    });
  }

  update(id: number, updateColorDto: UpdateColorDto) {
    return this.prisma.color.update({
      where: { id },
      data: updateColorDto,
    });
  }

  remove(id: number) {
    return this.prisma.color.delete({ where: { id } });
  }
}