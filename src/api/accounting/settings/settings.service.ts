import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Configuración clave-valor para parámetros contables globales.
 * Defaults se garantizan por la migración que los inserta como seed.
 */
@Injectable()
export class AccountingSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private static DEFAULTS: Record<string, string> = {
    TAX_REGIME: 'COMUN',
    IVA_RATE: '0.19',
    ACCOUNTING_AUTOCRON_ENABLED: 'true',
    COMPANY_NIT: '',
    COMPANY_NAME: 'TWO SIX',
  };

  async getAll() {
    const all = await this.prisma.accountingSetting.findMany({
      orderBy: { key: 'asc' },
    });
    return all;
  }

  async get(key: string): Promise<string> {
    const row = await this.prisma.accountingSetting.findUnique({ where: { key } });
    return row?.value ?? AccountingSettingsService.DEFAULTS[key] ?? '';
  }

  async getTaxRegime(): Promise<'COMUN' | 'SIMPLE'> {
    const v = await this.get('TAX_REGIME');
    return v === 'SIMPLE' ? 'SIMPLE' : 'COMUN';
  }

  async getIvaRate(): Promise<number> {
    const v = await this.get('IVA_RATE');
    const n = parseFloat(v);
    return Number.isFinite(n) && n >= 0 ? n : 0.19;
  }

  async set(key: string, value: string, description?: string, updatedBy?: number) {
    return this.prisma.accountingSetting.upsert({
      where: { key },
      update: { value, ...(description !== undefined && { description }), updated_by: updatedBy },
      create: {
        key,
        value,
        description: description ?? AccountingSettingsService.DEFAULTS[key] ?? null,
        updated_by: updatedBy,
      },
    });
  }

  /** Setea múltiples claves en una sola operación. */
  async setMany(updates: Array<{ key: string; value: string }>, updatedBy?: number) {
    const results: any[] = [];
    for (const u of updates) {
      results.push(await this.set(u.key, u.value, undefined, updatedBy));
    }
    return results;
  }
}
