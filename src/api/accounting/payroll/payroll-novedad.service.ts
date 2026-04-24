import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface CreateNovedadDto {
  id_employee: number;
  id_payroll_period: number;
  type: string;
  quantity?: number;
  amount?: number;
  description?: string;
}

@Injectable()
export class PayrollNovedadService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNovedadDto) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: dto.id_payroll_period },
    });
    if (!period)
      throw new NotFoundException('Período de nómina no encontrado.');
    if (period.status !== 'DRAFT') {
      throw new BadRequestException(
        `Solo se pueden registrar novedades en períodos DRAFT (actual: ${period.status}).`,
      );
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.id_employee },
    });
    if (!employee) throw new NotFoundException('Empleado no encontrado.');

    return this.prisma.payrollNovedad.create({
      data: {
        id_employee: dto.id_employee,
        id_payroll_period: dto.id_payroll_period,
        type: dto.type as any,
        quantity: dto.quantity ?? 0,
        amount: dto.amount ?? 0,
        description: dto.description,
      },
    });
  }

  findByPeriod(id_payroll_period: number) {
    return this.prisma.payrollNovedad.findMany({
      where: { id_payroll_period },
      include: {
        employee: { select: { id: true, name: true, document_number: true } },
      },
      orderBy: [{ id_employee: 'asc' }, { type: 'asc' }],
    });
  }

  async update(id: number, dto: Partial<CreateNovedadDto>) {
    const existing = await this.prisma.payrollNovedad.findUnique({
      where: { id },
      include: { payrollPeriod: true },
    });
    if (!existing) throw new NotFoundException('Novedad no encontrada.');
    if (existing.payrollPeriod.status !== 'DRAFT') {
      throw new BadRequestException(
        'Solo se editan novedades de períodos DRAFT.',
      );
    }

    return this.prisma.payrollNovedad.update({
      where: { id },
      data: {
        ...(dto.type && { type: dto.type as any }),
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.payrollNovedad.findUnique({
      where: { id },
      include: { payrollPeriod: true },
    });
    if (!existing) throw new NotFoundException('Novedad no encontrada.');
    if (existing.payrollPeriod.status !== 'DRAFT') {
      throw new BadRequestException(
        'Solo se eliminan novedades de períodos DRAFT.',
      );
    }
    return this.prisma.payrollNovedad.delete({ where: { id } });
  }
}
