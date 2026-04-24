import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PayrollNovedadService } from './payroll-novedad.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('PayrollNovedadService', () => {
  let service: PayrollNovedadService;
  const prismaMock: any = {
    payrollPeriod: { findUnique: jest.fn() },
    employee: { findUnique: jest.fn() },
    payrollNovedad: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollNovedadService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get(PayrollNovedadService);
  });

  describe('create', () => {
    it('rejects when period not found', async () => {
      prismaMock.payrollPeriod.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          id_employee: 1,
          id_payroll_period: 99,
          type: 'COMISION',
          amount: 100,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects when period is not DRAFT', async () => {
      prismaMock.payrollPeriod.findUnique.mockResolvedValue({
        id: 1,
        status: 'APPROVED',
      });
      await expect(
        service.create({
          id_employee: 1,
          id_payroll_period: 1,
          type: 'COMISION',
          amount: 100,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when employee not found', async () => {
      prismaMock.payrollPeriod.findUnique.mockResolvedValue({
        id: 1,
        status: 'DRAFT',
      });
      prismaMock.employee.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          id_employee: 99,
          id_payroll_period: 1,
          type: 'COMISION',
          amount: 100,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('creates successfully when valid', async () => {
      prismaMock.payrollPeriod.findUnique.mockResolvedValue({
        id: 1,
        status: 'DRAFT',
      });
      prismaMock.employee.findUnique.mockResolvedValue({ id: 1 });
      prismaMock.payrollNovedad.create.mockResolvedValue({ id: 10 });

      await service.create({
        id_employee: 1,
        id_payroll_period: 1,
        type: 'HORAS_EXTRA_DIURNAS',
        quantity: 4,
        amount: 50000,
        description: 'Turno extra sábado',
      });

      expect(prismaMock.payrollNovedad.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'HORAS_EXTRA_DIURNAS',
          quantity: 4,
          amount: 50000,
        }),
      });
    });
  });

  describe('remove', () => {
    it('rejects when novedad in approved period', async () => {
      prismaMock.payrollNovedad.findUnique.mockResolvedValue({
        id: 1,
        payrollPeriod: { status: 'APPROVED' },
      });
      await expect(service.remove(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('deletes when in DRAFT', async () => {
      prismaMock.payrollNovedad.findUnique.mockResolvedValue({
        id: 1,
        payrollPeriod: { status: 'DRAFT' },
      });
      prismaMock.payrollNovedad.delete.mockResolvedValue({ id: 1 });
      await service.remove(1);
      expect(prismaMock.payrollNovedad.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
