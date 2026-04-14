import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTaxConfigDto, TaxType } from './dto/create-tax-config.dto';

@Injectable()
export class TaxConfigService {
  constructor(private prisma: PrismaService) {}

  async create(createTaxConfigDto: CreateTaxConfigDto) {
    return this.prisma.taxConfiguration.create({
      data: {
        name: createTaxConfigDto.name,
        type: createTaxConfigDto.type,
        city_id: createTaxConfigDto.city_id,
        rate: createTaxConfigDto.rate,
        puc_account_debit: createTaxConfigDto.puc_account_debit,
        puc_account_credit: createTaxConfigDto.puc_account_credit,
        is_active: createTaxConfigDto.is_active ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.taxConfiguration.findMany({
      include: {
        city: true,
        pucAccountDebit: true,
        pucAccountCredit: true,
      },
    });
  }

  async findActiveByType(type: string, cityId?: number) {
    return this.prisma.taxConfiguration.findMany({
      where: {
        type,
        is_active: true,
        OR: [
          { city_id: cityId },
          { city_id: null }, // Configuraciones globales (como autorretención)
        ],
      },
      include: {
        pucAccountDebit: true,
        pucAccountCredit: true,
      },
    });
  }

  /**
   * Calcula los impuestos automáticos para una base gravable.
   *
   * Aplicaciones:
   *  - ICA: si hay ciudad
   *  - AUTORETENCION_RENTA: siempre (global)
   *  - RETEIVA: solo si el cliente es GRAN_CONTRIBUYENTE/AUTORETENEDOR
   *    (calculado sobre el IVA, no sobre el subtotal)
   *  - RETEICA: solo si el cliente es GRAN_CONTRIBUYENTE/AUTORETENEDOR
   *    (calculado sobre el subtotal, ciudad-dependiente)
   *
   * @param baseAmount Base gravable (subtotal sin IVA)
   * @param cityId ID de ciudad para ICA / ReteICA
   * @param opts.customerTaxStatus Estado tributario del cliente
   * @param opts.ivaAmount IVA generado (necesario para ReteIVA)
   */
  async calculateTaxes(
    baseAmount: number,
    cityId?: number,
    opts: { customerTaxStatus?: 'NORMAL' | 'GRAN_CONTRIBUYENTE' | 'AUTORETENEDOR'; ivaAmount?: number } = {},
  ) {
    const results: any[] = [];
    const applyRetentions =
      opts.customerTaxStatus === 'GRAN_CONTRIBUYENTE' ||
      opts.customerTaxStatus === 'AUTORETENEDOR';

    // 1. ICA — si hay ciudad
    if (cityId) {
      const icaConfigs = await this.findActiveByType(TaxType.ICA, cityId);
      for (const config of icaConfigs) {
        const amount = Number(baseAmount) * Number(config.rate);
        results.push({ config, type: TaxType.ICA, base: baseAmount, amount });
      }
    }

    // 2. Autorretención de renta — global, siempre
    const autoretencionConfigs = await this.findActiveByType(TaxType.AUTORETENCION_RENTA);
    for (const config of autoretencionConfigs) {
      const amount = Number(baseAmount) * Number(config.rate);
      results.push({ config, type: TaxType.AUTORETENCION_RENTA, base: baseAmount, amount });
    }

    // 3. ReteIVA — solo si el cliente practica retención y nos pasaron el IVA generado
    if (applyRetentions && opts.ivaAmount && opts.ivaAmount > 0) {
      const reteIvaConfigs = await this.findActiveByType('RETEIVA');
      for (const config of reteIvaConfigs) {
        const amount = Number(opts.ivaAmount) * Number(config.rate);
        results.push({ config, type: 'RETEIVA', base: opts.ivaAmount, amount });
      }
    }

    // 4. ReteICA — solo si el cliente practica retención (calculado sobre el subtotal)
    if (applyRetentions && cityId) {
      const reteIcaConfigs = await this.findActiveByType('RETEICA', cityId);
      for (const config of reteIcaConfigs) {
        const amount = Number(baseAmount) * Number(config.rate);
        results.push({ config, type: 'RETEICA', base: baseAmount, amount });
      }
    }

    return results;
  }

  async remove(id: number) {
    return this.prisma.taxConfiguration.delete({
      where: { id },
    });
  }
}
