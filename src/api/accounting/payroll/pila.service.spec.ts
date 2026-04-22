import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PilaService } from './pila.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccountingSettingsService } from '../settings/settings.service';

describe('PilaService', () => {
  let service: PilaService;
  const prismaMock: any = {
    payrollPeriod: { findFirst: jest.fn() },
    identificationType: { findMany: jest.fn() },
  };
  const settingsMock: any = { get: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    settingsMock.get.mockResolvedValue('TWO SIX SAS');
    prismaMock.identificationType.findMany.mockResolvedValue([
      { id: 1, code: 'CC' },
      { id: 2, code: 'NIT' },
      { id: 3, code: 'CE' },
      { id: 4, code: 'PAS' },
      { id: 5, code: 'TI' },
    ]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PilaService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AccountingSettingsService, useValue: settingsMock },
      ],
    }).compile();
    service = module.get(PilaService);
  });

  it('rejects when no approved period exists', async () => {
    prismaMock.payrollPeriod.findFirst.mockResolvedValue(null);
    await expect(service.generatePila(2026, 4, '900000')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('maps identification codes to PILA codes correctly', async () => {
    prismaMock.payrollPeriod.findFirst.mockResolvedValue({
      id: 1,
      entries: [
        {
          ibc: 1300000,
          gross_salary: 1462000,
          health_employee: 52000,
          pension_employee: 52000,
          health_employer: 0,
          pension_employer: 156000,
          arl_employer: 6786,
          sena_employer: 0,
          icbf_employer: 0,
          caja_employer: 52000,
          employee: {
            id_identification_type: 4, // PAS
            document_number: 'AB123456',
            name: 'Extranjero',
            position: 'Consultor',
          },
        },
        {
          ibc: 1300000,
          gross_salary: 1300000,
          health_employee: 52000,
          pension_employee: 52000,
          health_employer: 0,
          pension_employer: 156000,
          arl_employer: 6786,
          sena_employer: 0,
          icbf_employer: 0,
          caja_employer: 52000,
          employee: {
            id_identification_type: 1, // CC
            document_number: '12345678',
            name: 'Empleado',
            position: 'Operario',
          },
        },
      ],
    });

    const result = await service.generatePila(2026, 4, '900000000');

    expect(result.filename).toBe('pila-2026-04.txt');
    const lines = result.content.split('\n');
    expect(lines[0]).toContain('TWO SIX SAS'); // razón social desde settings
    // PAS → PA
    expect(lines[1]).toContain('|PA|');
    // CC → CC
    expect(lines[2]).toContain('|CC|');
    expect(result.summary.cotizantes).toBe(2);
  });

  it('fallbacks to CC when identification code is unknown', async () => {
    prismaMock.payrollPeriod.findFirst.mockResolvedValue({
      id: 1,
      entries: [
        {
          ibc: 1000000,
          gross_salary: 1000000,
          health_employee: 40000,
          pension_employee: 40000,
          health_employer: 0,
          pension_employer: 120000,
          arl_employer: 5220,
          sena_employer: 0,
          icbf_employer: 0,
          caja_employer: 40000,
          employee: {
            id_identification_type: 999, // inexistente
            document_number: 'X',
            name: 'Desconocido',
            position: 'N/A',
          },
        },
      ],
    });

    const result = await service.generatePila(2026, 4, '900000000');
    const detailLine = result.content.split('\n')[1];
    expect(detailLine).toContain('|CC|');
  });
});
