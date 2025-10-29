import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProveedorService {
  constructor(private readonly prisma: PrismaService) {}

  create(createProveedorDto: CreateProveedorDto) {
    return this.prisma.proveedor.create({
      data: createProveedorDto,
    });
  }

  findAll() {
    return this.prisma.proveedor.findMany();
  }

  async findOne(nit: string) {
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { nit },
    });

    if (!proveedor) {
      throw new NotFoundException(`Proveedor con NIT #${nit} no encontrado.`);
    }

    return proveedor;
  }

  async update(nit: string, updateProveedorDto: UpdateProveedorDto) {
    await this.findOne(nit);
    return this.prisma.proveedor.update({
      where: { nit },
      data: updateProveedorDto,
    });
  }

  async remove(nit: string) {
    await this.findOne(nit);
    return this.prisma.proveedor.delete({
      where: { nit },
    });
  }
}