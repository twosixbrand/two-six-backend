import { Test, TestingModule } from '@nestjs/testing';
import { TaxConfigService } from './tax-config.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccountingSettingsService } from '../settings/settings.service';

describe('TaxConfigService.calculateTaxes', () => {
  let service: TaxConfigService;
  const prismaMock: any = {
    taxConfiguration: { findMany: jest.fn() },
  };
  const settingsMock: any = { getTaxRegime: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxConfigService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AccountingSettingsService, useValue: settingsMock },
      ],
    }).compile();
    service = module.get(TaxConfigService);
  });

  it('régimen SIMPLE no retorna impuestos', async () => {
    settingsMock.getTaxRegime.mockResolvedValue('SIMPLE');
    prismaMock.taxConfiguration.findMany.mockResolvedValue([]);
    const result = await service.calculateTaxes(100000, 1);
    expect(result).toEqual([]);
    expect(prismaMock.taxConfiguration.findMany).not.toHaveBeenCalled();
  });

  it('régimen COMUN aplica ICA si hay cityId', async () => {
    settingsMock.getTaxRegime.mockResolvedValue('COMUN');
    prismaMock.taxConfiguration.findMany.mockImplementation(
      ({ where }: any) => {
        if (where.type === 'ICA')
          return Promise.resolve([{ rate: 0.01104, config: { name: 'ICA' } }]);
        return Promise.resolve([]);
      },
    );
    const result = await service.calculateTaxes(100000, 1);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe('ICA');
  });

  it('régimen COMUN no aplica ReteIVA/ReteICA si cliente es NORMAL', async () => {
    settingsMock.getTaxRegime.mockResolvedValue('COMUN');
    prismaMock.taxConfiguration.findMany.mockImplementation(
      ({ where }: any) => {
        if (where.type === 'RETEIVA') return Promise.resolve([{ rate: 0.15 }]);
        if (where.type === 'RETEICA')
          return Promise.resolve([{ rate: 0.01104 }]);
        return Promise.resolve([]);
      },
    );

    const result = await service.calculateTaxes(100000, 1, {
      customerTaxStatus: 'NORMAL',
      ivaAmount: 19000,
    });
    // No deberían aparecer RETEIVA/RETEICA
    const types = result.map((r: any) => r.type);
    expect(types).not.toContain('RETEIVA');
    expect(types).not.toContain('RETEICA');
  });

  it('régimen COMUN aplica ReteIVA y ReteICA si cliente es GRAN_CONTRIBUYENTE', async () => {
    settingsMock.getTaxRegime.mockResolvedValue('COMUN');
    prismaMock.taxConfiguration.findMany.mockImplementation(
      ({ where }: any) => {
        if (where.type === 'RETEIVA')
          return Promise.resolve([{ rate: 0.15, config: {} }]);
        if (where.type === 'RETEICA')
          return Promise.resolve([{ rate: 0.01104, config: {} }]);
        return Promise.resolve([]);
      },
    );

    const result = await service.calculateTaxes(100000, 1, {
      customerTaxStatus: 'GRAN_CONTRIBUYENTE',
      ivaAmount: 19000,
    });

    const reteIva = result.find((r: any) => r.type === 'RETEIVA');
    expect(reteIva).toBeDefined();
    expect(reteIva!.amount).toBeCloseTo(19000 * 0.15, 2);

    const reteIca = result.find((r: any) => r.type === 'RETEICA');
    expect(reteIca).toBeDefined();
    expect(reteIca!.amount).toBeCloseTo(100000 * 0.01104, 2);
  });
});
