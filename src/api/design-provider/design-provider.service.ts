import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDesignProviderDto } from './dto/create-design-provider.dto';
import { UpdateDesignProviderDto } from './dto/update-design-provider.dto';

@Injectable()
export class DesignProviderService {
  constructor(private prisma: PrismaService) {}

  createDesignProvider(createDesignProviderDto: CreateDesignProviderDto) {
    return this.prisma.designProvider.create({
      data: createDesignProviderDto,
    });
  }

  findByDesignId(id_design: number) {
    return this.prisma.designProvider.findMany({
      where: { id_design },
    });
  }

  findAll() {
    return this.prisma.designProvider.findMany({
      include: {
        design: true,
        provider: true,
        productionType: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.designProvider.findUnique({
      where: { id },
      include: {
        design: true,
        provider: true,
        productionType: true,
      },
    });
  }

  update(id: number, updateDesignProviderDto: UpdateDesignProviderDto) {
    return this.prisma.designProvider.update({ where: { id }, data: updateDesignProviderDto });
  }

  remove(id: number) {
    return this.prisma.designProvider.delete({ where: { id } });
  }
}
