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
   * Calcula los impuestos (ICA y Autorretención) para una base gravable
   * @param baseAmount Base de cálculo (ej. subtotal de la factura)
   * @param cityId ID de la ciudad para el ICA
   */
  async calculateTaxes(baseAmount: number, cityId?: number) {
    const results: any[] = [];
    
    // 1. Buscar configuraciones de ICA activas para la ciudad
    if (cityId) {
      const icaConfigs = await this.findActiveByType(TaxType.ICA, cityId);
      for (const config of icaConfigs) {
        const amount = Number(baseAmount) * Number(config.rate);
        results.push({
          config,
          type: TaxType.ICA,
          base: baseAmount,
          amount,
        });
      }
    }

    // 2. Buscar autorretención activa (suele ser global)
    const autoretencionConfigs = await this.findActiveByType(TaxType.AUTORETENCION_RENTA);
    for (const config of autoretencionConfigs) {
      const amount = Number(baseAmount) * Number(config.rate);
      results.push({
        config,
        type: TaxType.AUTORETENCION_RENTA,
        base: baseAmount,
        amount,
      });
    }

    return results;
  }

  async remove(id: number) {
    return this.prisma.taxConfiguration.delete({
      where: { id },
    });
  }
}
