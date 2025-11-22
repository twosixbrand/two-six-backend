import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findOne(id: number) {
    const designProvider = await this.prisma.designProvider.findUnique({
      where: { id },
      include: {
        design: true,
        provider: true,
        productionType: true,
      },
    });
    if (!designProvider) {
      throw new NotFoundException(`Registro con ID #${id} no encontrado.`);
    }
    return designProvider;
  }

  async update(id: number, updateDesignProviderDto: UpdateDesignProviderDto) {
    await this.findOne(id); // Asegura que el registro exista

    const { id_design, id_provider, id_production_type, ...otherData } =
      updateDesignProviderDto;

    const dataToUpdate: any = { ...otherData };

    if (id_design) {
      dataToUpdate.design = { connect: { id: id_design } };
    }
    if (id_provider) {
      dataToUpdate.provider = { connect: { id: id_provider } };
    }
    if (id_production_type) {
      dataToUpdate.productionType = { connect: { id: id_production_type } };
    }

    return this.prisma.designProvider.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  remove(id: number) {
    return this.prisma.designProvider.delete({ where: { id } });
  }
}
