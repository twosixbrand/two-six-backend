import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDesignClothingDto } from './dto/create-design-clothing.dto';
import { UpdateDesignClothingDto } from './dto/update-design-clothing.dto';

@Injectable()
export class DesignClothingService {
  constructor(private prisma: PrismaService) {}

  create(createDesignClothingDto: CreateDesignClothingDto) {
    return this.prisma.designClothing.create({
      data: createDesignClothingDto,
    });
  }

  findAll() {
    return this.prisma.designClothing.findMany();
  }

  findOne(id: number) {
    return this.prisma.designClothing.findUnique({
      where: { id },
    });
  }

  update(id: number, updateDesignClothingDto: UpdateDesignClothingDto) {
    return this.prisma.designClothing.update({
      where: { id },
      data: updateDesignClothingDto,
    });
  }

  remove(id: number) {
    return this.prisma.designClothing.delete({ where: { id } });
  }
}