import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TagService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string }) {
    // Generate simple slug
    const slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await this.prisma.tag.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Tag con slug '${slug}' ya existe.`);
    }

    return this.prisma.tag.create({
      data: {
        name: data.name,
        slug,
      },
    });
  }

  findAll() {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });
    if (!tag) {
      throw new NotFoundException(`Tag #${id} no encontrado.`);
    }
    return tag;
  }

  async update(id: number, data: { name: string }) {
    await this.findOne(id);

    let slug;
    if (data.name) {
      slug = data.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const existing = await this.prisma.tag.findUnique({ where: { slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Tag con slug '${slug}' ya existe.`);
      }
    }

    return this.prisma.tag.update({
      where: { id },
      data: {
        name: data.name,
        ...(slug && { slug }),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tag.delete({
      where: { id },
    });
  }
}
