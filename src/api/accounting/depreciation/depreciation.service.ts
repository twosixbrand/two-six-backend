import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DepreciationService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    const assets = await this.prisma.fixedAsset.findMany({
      include: {
        depreciationEntries: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    return assets.map((a) => {
      const lastEntry = a.depreciationEntries[0];
      const monthlyDep = (a.acquisition_cost - a.salvage_value) / a.useful_life_months;
      return {
        ...a,
        monthly_depreciation: Math.round(monthlyDep * 100) / 100,
        accumulated_depreciation: lastEntry ? lastEntry.accumulated : 0,
        current_book_value: lastEntry ? lastEntry.book_value : a.acquisition_cost,
      };
    });
  }

  async create(data: {
    name: string;
    description?: string;
    acquisition_date: string;
    acquisition_cost: number;
    useful_life_months: number;
    salvage_value?: number;
    depreciation_method?: string;
    id_puc_asset: number;
    id_puc_depreciation: number;
    id_puc_accumulated: number;
  }) {
    return this.prisma.fixedAsset.create({
      data: {
        name: data.name,
        description: data.description,
        acquisition_date: new Date(data.acquisition_date),
        acquisition_cost: data.acquisition_cost,
        useful_life_months: data.useful_life_months,
        salvage_value: data.salvage_value ?? 0,
        depreciation_method: data.depreciation_method ?? 'STRAIGHT_LINE',
        id_puc_asset: data.id_puc_asset,
        id_puc_depreciation: data.id_puc_depreciation,
        id_puc_accumulated: data.id_puc_accumulated,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.fixedAsset.findUnique({
      where: { id },
      include: {
        depreciationEntries: {
          orderBy: [{ year: 'asc' }, { month: 'asc' }],
        },
      },
    });
  }

  async runMonthlyDepreciation(year: number, month: number) {
    const assets = await this.prisma.fixedAsset.findMany({
      where: { is_active: true },
      include: {
        depreciationEntries: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        },
      },
    });

    const results: any[] = [];

    for (const asset of assets) {
      // Skip if already depreciated for this month
      const alreadyExists = asset.depreciationEntries.find(
        (e) => e.year === year && e.month === month,
      );
      if (alreadyExists) {
        results.push({
          asset: asset.name,
          status: 'SKIPPED',
          reason: 'Already depreciated for this period',
        });
        continue;
      }

      const monthlyAmount = (asset.acquisition_cost - asset.salvage_value) / asset.useful_life_months;
      const lastEntry = asset.depreciationEntries[0]; // Most recent due to DESC ordering
      const previousAccumulated = lastEntry ? lastEntry.accumulated : 0;
      const newAccumulated = previousAccumulated + monthlyAmount;
      const newBookValue = asset.acquisition_cost - newAccumulated;

      // Check if fully depreciated
      if (newBookValue < asset.salvage_value) {
        results.push({
          asset: asset.name,
          status: 'SKIPPED',
          reason: 'Fully depreciated',
        });
        continue;
      }

      // Generate next entry number
      const lastJournal = await this.prisma.journalEntry.findFirst({
        orderBy: { id: 'desc' },
      });
      const nextNum = lastJournal
        ? `DEP-${String(parseInt(lastJournal.entry_number.replace(/\D/g, '') || '0', 10) + 1).padStart(6, '0')}`
        : 'DEP-000001';

      // Create journal entry for depreciation
      const journalEntry = await this.prisma.journalEntry.create({
        data: {
          entry_number: nextNum,
          entry_date: new Date(year, month - 1, 28), // last working day-ish
          description: `Depreciación ${asset.name} - ${year}/${String(month).padStart(2, '0')}`,
          source_type: 'DEPRECIATION',
          status: 'POSTED',
          total_debit: Math.round(monthlyAmount * 100) / 100,
          total_credit: Math.round(monthlyAmount * 100) / 100,
          lines: {
            create: [
              {
                id_puc_account: asset.id_puc_depreciation,
                description: `Gasto depreciación - ${asset.name}`,
                debit: Math.round(monthlyAmount * 100) / 100,
                credit: 0,
              },
              {
                id_puc_account: asset.id_puc_accumulated,
                description: `Depreciación acumulada - ${asset.name}`,
                debit: 0,
                credit: Math.round(monthlyAmount * 100) / 100,
              },
            ],
          },
        },
      });

      // Create depreciation entry
      await this.prisma.depreciationEntry.create({
        data: {
          id_fixed_asset: asset.id,
          year,
          month,
          amount: Math.round(monthlyAmount * 100) / 100,
          accumulated: Math.round(newAccumulated * 100) / 100,
          book_value: Math.round(newBookValue * 100) / 100,
          journal_entry_id: journalEntry.id,
        },
      });

      results.push({
        asset: asset.name,
        status: 'DEPRECIATED',
        amount: Math.round(monthlyAmount * 100) / 100,
        accumulated: Math.round(newAccumulated * 100) / 100,
        book_value: Math.round(newBookValue * 100) / 100,
        journal_entry_id: journalEntry.id,
      });
    }

    return {
      period: { year, month },
      results,
      summary: {
        total: results.length,
        depreciated: results.filter((r) => r.status === 'DEPRECIATED').length,
        skipped: results.filter((r) => r.status === 'SKIPPED').length,
        totalAmount: results
          .filter((r) => r.status === 'DEPRECIATED')
          .reduce((s, r) => s + r.amount, 0),
      },
    };
  }
}
