import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Injectable()
export class CollectionService {
  constructor(private prisma: PrismaService) {}

  create(createCollectionDto: CreateCollectionDto) {
    return this.prisma.collection.create({
      data: createCollectionDto,
      include: { season: true, yearProduction: true },
    });
  }

  findAll() {
    return this.prisma.collection.findMany({
      include: { season: true, yearProduction: true },
    });
  }

  findOne(id: number) {
    return this.prisma.collection.findUnique({
      where: { id },
      include: { season: true, yearProduction: true },
    });
  }

  update(id: number, updateCollectionDto: UpdateCollectionDto) {
    return this.prisma.collection.update({
      where: { id },
      data: updateCollectionDto,
      include: { season: true, yearProduction: true },
    });
  }

  remove(id: number) {
    return this.prisma.collection.delete({ where: { id } });
  }
}
