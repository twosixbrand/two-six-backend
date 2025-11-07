import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMasterDesignDto } from './dto/create-master-design.dto';
import { UpdateMasterDesignDto } from './dto/update-master-design.dto';

@Injectable()
export class MasterDesignService {
  constructor(private prisma: PrismaService) {}

  create(createMasterDesignDto: CreateMasterDesignDto) {
    return this.prisma.design.create({
      data: createMasterDesignDto,
    });
  }

  findAll() {
    return this.prisma.design.findMany();
  }

  findOne(id: number) {
    return this.prisma.design.findUnique({
      where: { id },
    });
  }

  update(id: number, updateMasterDesignDto: UpdateMasterDesignDto) {
    return this.prisma.design.update({
      where: { id },
      data: updateMasterDesignDto,
    });
  }

  remove(id: number) {
    return this.prisma.design.delete({ where: { id } });
  }
}