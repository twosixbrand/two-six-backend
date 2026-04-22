import { Test, TestingModule } from '@nestjs/testing';
import { AccountingSettingsService } from './settings.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('AccountingSettingsService', () => {
  let service: AccountingSettingsService;
  const prismaMock: any = {
    accountingSetting: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingSettingsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get(AccountingSettingsService);
  });

  describe('get', () => {
    it('returns stored value when found', async () => {
      prismaMock.accountingSetting.findUnique.mockResolvedValue({
        key: 'TAX_REGIME',
        value: 'SIMPLE',
      });
      await expect(service.get('TAX_REGIME')).resolves.toBe('SIMPLE');
    });

    it('returns default when key missing', async () => {
      prismaMock.accountingSetting.findUnique.mockResolvedValue(null);
      await expect(service.get('TAX_REGIME')).resolves.toBe('COMUN');
    });

    it('returns empty string for unknown key with no default', async () => {
      prismaMock.accountingSetting.findUnique.mockResolvedValue(null);
      await expect(service.get('UNKNOWN_KEY')).resolves.toBe('');
    });
  });

  describe('getTaxRegime', () => {
    it('returns COMUN by default', async () => {
      prismaMock.accountingSetting.findUnique.mockResolvedValue(null);
      await expect(service.getTaxRegime()).resolves.toBe('COMUN');
    });

    it('returns SIMPLE when configured', async () => {
      prismaMock.accountingSetting.findUnique.mockResolvedValue({ value: 'SIMPLE' });
      await expect(service.getTaxRegime()).resolves.toBe('SIMPLE');
    });

    it('normalizes unexpected values to COMUN', async () => {
      prismaMock.accountingSetting.findUnique.mockResolvedValue({ value: 'OTHER' });
      await expect(service.getTaxRegime()).resolves.toBe('COMUN');
    });
  });

  describe('getIvaRate', () => {
    it('parses numeric string', async () => {
      prismaMock.accountingSetting.findUnique.mockResolvedValue({ value: '0.19' });
      await expect(service.getIvaRate()).resolves.toBe(0.19);
    });

    it('falls back to 0.19 on invalid', async () => {
      prismaMock.accountingSetting.findUnique.mockResolvedValue({ value: 'abc' });
      await expect(service.getIvaRate()).resolves.toBe(0.19);
    });
  });

  describe('set', () => {
    it('upserts with description and updated_by', async () => {
      prismaMock.accountingSetting.upsert.mockResolvedValue({ key: 'X', value: '1' });
      await service.set('X', '1', 'desc', 42);
      expect(prismaMock.accountingSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'X' },
          update: expect.objectContaining({ value: '1', description: 'desc', updated_by: 42 }),
          create: expect.objectContaining({ key: 'X', value: '1', updated_by: 42 }),
        }),
      );
    });
  });
});
