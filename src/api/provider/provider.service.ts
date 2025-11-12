import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Provider } from '@prisma/client';

@Injectable()
export class ProviderService {
  constructor(private readonly prisma: PrismaService) {}

  create(createProviderDto: CreateProviderDto): Promise<Provider> {
    return this.prisma.provider.create({
      data: createProviderDto,
    });
  }

  findAll(): Promise<Provider[]> {
    return this.prisma.provider.findMany();
  }

  async findOne(nit: string): Promise<Provider> {
    const provider = await this.prisma.provider.findUnique({
      where: { id: nit },
    });

    if (!provider) {
      throw new NotFoundException(`Proveedor con NIT #${nit} no encontrado.`);
    }

    return provider;
  }

  async update(
    nit: string,
    updateProviderDto: UpdateProviderDto,
  ): Promise<Provider> {
    await this.findOne(nit);
    return this.prisma.provider.update({
      where: { id: nit },
      data: updateProviderDto,
    });
  }

  async remove(nit: string): Promise<Provider> {
    await this.findOne(nit);
    return this.prisma.provider.delete({
      where: { id: nit },
    });
  }
}