import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';

@Injectable()
export class SizeService {
  constructor(private prisma: PrismaService) {}

  create(createSizeDto: CreateSizeDto) {
    return this.prisma.size.create({
      data: createSizeDto,
    });
  }

  findAll() {
    return this.prisma.size.findMany();
  }

  findOne(id: number) {
    return this.prisma.size.findUnique({
      where: { id },
    });
  }

  update(id: number, updateSizeDto: UpdateSizeDto) {
    return this.prisma.size.update({
      where: { id },
      data: updateSizeDto,
    });
  }

  remove(id: number) {
    return this.prisma.size.delete({ where: { id } });
  }
}