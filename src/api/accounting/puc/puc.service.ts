import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePucAccountDto } from './dto/create-puc-account.dto';
import { UpdatePucAccountDto } from './dto/update-puc-account.dto';

@Injectable()
export class PucService {
  constructor(private prisma: PrismaService) { }

  async findAll(search?: string) {
    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.pucAccount.findMany({
      where,
      orderBy: { code: 'asc' },
    });
  }

  async getTree() {
    const accounts = await this.prisma.pucAccount.findMany({
      orderBy: { code: 'asc' },
    });

    // Build nested tree from flat data
    const accountMap = new Map<string, any>();
    const roots: any[] = [];

    // First pass: create a map of all accounts with children arrays
    for (const account of accounts) {
      accountMap.set(account.code, { ...account, children: [] });
    }

    // Second pass: assign children to their parents
    for (const account of accounts) {
      const node = accountMap.get(account.code);
      if (account.parent_code && accountMap.has(account.parent_code)) {
        accountMap.get(account.parent_code).children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async findOne(id: number) {
    const account = await this.prisma.pucAccount.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!account) {
      throw new NotFoundException(`Cuenta PUC con ID ${id} no encontrada`);
    }

    return account;
  }

  async create(dto: CreatePucAccountDto) {
    // Validate code uniqueness
    const existing = await this.prisma.pucAccount.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Ya existe una cuenta con el código ${dto.code}`);
    }

    // Validate parent exists if provided
    if (dto.parent_code) {
      const parent = await this.prisma.pucAccount.findUnique({
        where: { code: dto.parent_code },
      });

      if (!parent) {
        throw new BadRequestException(`La cuenta padre con código ${dto.parent_code} no existe`);
      }
    }

    return this.prisma.pucAccount.create({
      data: {
        code: dto.code,
        name: dto.name,
        level: dto.level,
        nature: dto.nature,
        parent_code: dto.parent_code,
        is_active: dto.is_active ?? true,
        accepts_movements: dto.accepts_movements ?? false,
      },
    });
  }

  async update(id: number, dto: UpdatePucAccountDto) {
    const account = await this.prisma.pucAccount.findUnique({ where: { id } });

    if (!account) {
      throw new NotFoundException(`Cuenta PUC con ID ${id} no encontrada`);
    }

    // Validate parent exists if provided
    if (dto.parent_code) {
      const parent = await this.prisma.pucAccount.findUnique({
        where: { code: dto.parent_code },
      });

      if (!parent) {
        throw new BadRequestException(`La cuenta padre con código ${dto.parent_code} no existe`);
      }
    }

    return this.prisma.pucAccount.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    const account = await this.prisma.pucAccount.findUnique({ where: { id } });

    if (!account) {
      throw new NotFoundException(`Cuenta PUC con ID ${id} no encontrada`);
    }

    // Check if account has journal entry lines
    const linesCount = await this.prisma.journalEntryLine.count({
      where: { id_puc_account: id },
    });

    if (linesCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar la cuenta ${account.code} porque tiene ${linesCount} movimientos contables asociados`,
      );
    }

    return this.prisma.pucAccount.delete({ where: { id } });
  }
}
