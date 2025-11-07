import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateYearProductionDto } from './dto/create-year-production.dto';
import { UpdateYearProductionDto } from './dto/update-year-production.dto';

@Injectable()
export class YearProductionService {
  constructor(private prisma: PrismaService) {}

  create(createYearProductionDto: CreateYearProductionDto) {
    return this.prisma.yearProduction.create({
      data: createYearProductionDto,
    });
  }

  findAll() {
    return this.prisma.yearProduction.findMany();
  }

  findOne(id: string) {
    return this.prisma.yearProduction.findUnique({
      where: { id },
    });
  }

  update(id: string, updateYearProductionDto: UpdateYearProductionDto) {
    return this.prisma.yearProduction.update({
      where: { id },
      data: updateYearProductionDto,
    });
  }

  remove(id: string) {
    return this.prisma.yearProduction.delete({ where: { id } });
  }
}