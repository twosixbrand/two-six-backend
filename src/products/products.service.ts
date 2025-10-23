// src/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Gender, Product } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  create(createProductDto: CreateProductDto): Promise<Product> {
    // Siendo explícitos con los datos, eliminamos el error de "unsafe assignment".
    return this.prisma.product.create({
      data: createProductDto,
    });
  }

  findAll(gender?: Gender, isOutlet?: boolean): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        gender, // Si 'gender' es undefined, Prisma lo ignora.
        isOutlet, // Si 'isOutlet' es undefined, Prisma también lo ignora.
      },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID #${id} not found`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    await this.findOne(id); // Reutilizamos para verificar si existe
    return this.prisma.product.update({
      where: { id },
      // Al igual que en create, ser explícito con los datos soluciona el error.
      // El `updateProductDto` puede contener propiedades extra si no se desestructura.
      data: updateProductDto,
    });
  }

  async remove(id: number): Promise<Product> {
    await this.findOne(id); // Reutilizamos para verificar si existe
    return this.prisma.product.delete({ where: { id } });
  }
}
