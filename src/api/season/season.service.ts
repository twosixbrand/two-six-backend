import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';

@Injectable()
export class SeasonService {
  constructor(private prisma: PrismaService) {}

  create(createSeasonDto: CreateSeasonDto) {
    return this.prisma.season.create({
      data: createSeasonDto,
    });
  }

  findAll() {
    return this.prisma.season.findMany();
  }

  findOne(id: number) {
    return this.prisma.season.findUnique({
      where: { id },
    });
  }

  update(id: number, updateSeasonDto: UpdateSeasonDto) {
    return this.prisma.season.update({
      where: { id },
      data: updateSeasonDto,
    });
  }

  remove(id: number) {
    return this.prisma.season.delete({ where: { id } });
  }
}