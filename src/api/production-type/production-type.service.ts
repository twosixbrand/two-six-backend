import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductionTypeDto } from './dto/create-production-type.dto';
import { UpdateProductionTypeDto } from './dto/update-production-type.dto';

@Injectable()
export class ProductionTypeService {
  constructor(private prisma: PrismaService) {}

  create(createProductionTypeDto: CreateProductionTypeDto) {
    return this.prisma.productionType.create({
      data: createProductionTypeDto,
    });
  }

  findAll() {
    return this.prisma.productionType.findMany();
  }

  findOne(id: number) {
    return this.prisma.productionType.findUnique({ where: { id } });
  }

  update(id: number, updateProductionTypeDto: UpdateProductionTypeDto) {
    return this.prisma.productionType.update({
      where: { id },
      data: updateProductionTypeDto,
    });
  }

  remove(id: number) {
    return this.prisma.productionType.delete({ where: { id } });
  }
}
