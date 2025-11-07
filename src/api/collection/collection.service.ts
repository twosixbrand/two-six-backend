import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Injectable()
export class CollectionService {
  constructor(private prisma: PrismaService) {}

  create(createCollectionDto: CreateCollectionDto) {
    return this.prisma.collection.create({
      data: createCollectionDto,
    });
  }

  findAll() {
    return this.prisma.collection.findMany();
  }

  findOne(id: number) {
    return this.prisma.collection.findUnique({
      where: { id },
    });
  }

  update(id: number, updateCollectionDto: UpdateCollectionDto) {
    return this.prisma.collection.update({
      where: { id },
      data: updateCollectionDto,
    });
  }

  remove(id: number) {
    return this.prisma.collection.delete({ where: { id } });
  }
}