import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DepreciationService } from '../depreciation/depreciation.service';
import { ClosingService } from '../closing/closing.service';

/**
 * Automatizaciones contables programadas:
 *  - Depreciación mensual: día 1 del mes a las 02:00 corre la depreciación
 *    del mes anterior.
 *  - Cierre contable: día 5 del mes a las 03:00 cierra el mes anterior
 *    (da 5 días de gracia para correcciones/asientos extemporáneos).
 *
 * Ambos jobs son idempotentes gracias a las validaciones existentes:
 *  - DepreciationService detecta si ya se corrió depreciación del mes.
 *  - ClosingService detecta si el periodo ya está cerrado.
 *
 * Los cron se pueden desactivar via env var `ACCOUNTING_AUTOCRON_ENABLED=false`
 * para ambientes de staging o pruebas.
 */
@Injectable()
export class AccountingCronService {
  private readonly logger = new Logger(AccountingCronService.name);

  constructor(
    private readonly depreciationService: DepreciationService,
    private readonly closingService: ClosingService,
  ) {}

  private isEnabled(): boolean {
    const flag = process.env.ACCOUNTING_AUTOCRON_ENABLED;
    return flag === undefined || flag === 'true';
  }

  private previousMonth(): { year: number; month: number } {
    const now = new Date();
    now.setDate(1);
    now.setMonth(now.getMonth() - 1);
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }

  /**
   * Día 1 a las 02:00 → depreciación del mes anterior.
   */
  @Cron('0 2 1 * *', { name: 'accounting-auto-depreciation' })
  async autoDepreciation() {
    if (!this.isEnabled()) {
      this.logger.log('Auto-depreciación deshabilitada por env var.');
      return;
    }
    const { year, month } = this.previousMonth();
    this.logger.log(`Iniciando auto-depreciación ${year}-${month}...`);
    try {
      const result = await this.depreciationService.runMonthlyDepreciation(year, month);
      this.logger.log(`Auto-depreciación ${year}-${month} completada. Resultado: ${JSON.stringify(result).slice(0, 200)}`);
    } catch (err: any) {
      this.logger.error(`Error en auto-depreciación ${year}-${month}: ${err.message}`);
    }
  }

  /**
   * Día 5 a las 03:00 → cierre automático del mes anterior.
   */
  @Cron('0 3 5 * *', { name: 'accounting-auto-closing' })
  async autoClosing() {
    if (!this.isEnabled()) {
      this.logger.log('Auto-cierre deshabilitado por env var.');
      return;
    }
    const { year, month } = this.previousMonth();
    this.logger.log(`Iniciando auto-cierre ${year}-${month}...`);
    try {
      const result = await this.closingService.closePeriod(year, month, 'SYSTEM_CRON');
      this.logger.log(`Auto-cierre ${year}-${month} completado. Resultado: ${JSON.stringify(result).slice(0, 200)}`);
    } catch (err: any) {
      this.logger.error(`Error en auto-cierre ${year}-${month}: ${err.message}`);
    }
  }
}
