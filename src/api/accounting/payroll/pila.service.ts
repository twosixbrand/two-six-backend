import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccountingSettingsService } from '../settings/settings.service';

/**
 * Generación de archivo PILA (Planilla Integrada de Liquidación de Aportes)
 * siguiendo la Resolución 2388/2016 del Ministerio de Salud y la UGPP.
 *
 * Produce los registros tipo 1 (encabezado) y tipo 2 (detalle empleado)
 * con los campos clave para autoliquidación.
 */
@Injectable()
export class PilaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: AccountingSettingsService,
  ) {}

  /**
   * Mapping de códigos internos de identificación → códigos PILA oficiales
   * (Resolución 2388/2016 Anexo Técnico 2 - Tabla 2).
   */
  private static readonly PILA_ID_CODE: Record<string, string> = {
    CC: 'CC', // Cédula de ciudadanía
    NIT: 'NI', // NIT (personas jurídicas, poco común en PILA de empleados)
    CE: 'CE', // Cédula de extranjería
    PAS: 'PA', // Pasaporte
    TI: 'TI', // Tarjeta de identidad
    RC: 'RC', // Registro civil
    AS: 'AS', // Adulto sin identificar
    MS: 'MS', // Menor sin identificar
    PEP: 'PE', // Permiso especial de permanencia
  };

  async generatePila(year: number, month: number, employerNit: string) {
    const period = (await this.prisma.payrollPeriod.findFirst({
      where: { year, month, status: 'APPROVED' },
      include: {
        entries: { include: { employee: true } },
      },
    })) as any;

    if (!period) {
      throw new NotFoundException(
        `No hay período de nómina aprobado para ${year}-${String(month).padStart(2, '0')}.`,
      );
    }

    // Helpers de formato
    const pad = (s: string | number, n: number, char = '0', left = true) => {
      const v = String(s);
      if (v.length >= n) return v.substring(0, n);
      return left ? v.padStart(n, char) : v.padEnd(n, char);
    };
    const padR = (s: string | number, n: number) => pad(s, n, ' ', false);
    const num = (n: number, len: number) => pad(Math.round(n), len);

    const periodoLiquidacion = `${year}-${String(month).padStart(2, '0')}`;

    // ============ Registro tipo 1: Encabezado ============
    const totalEntries: number = period.entries.length;
    const totalGross: number = period.entries.reduce(
      (s: number, e: any) => s + e.gross_salary,
      0,
    );
    const totalAportes: number = period.entries.reduce(
      (s: number, e: any) =>
        s +
        e.health_employee +
        e.pension_employee +
        e.health_employer +
        e.pension_employer +
        e.arl_employer +
        e.sena_employer +
        e.icbf_employer +
        e.caja_employer,
      0,
    );

    // Razón social desde settings
    const companyName =
      (await this.settingsService.get('COMPANY_NAME')) || 'TWO SIX';

    // Precarga de tipos de identificación para mapping → código PILA
    const idTypes = await this.prisma.identificationType.findMany();
    const idTypeById = new Map<number, string>();
    for (const t of idTypes) idTypeById.set(t.id, t.code);

    // Layout simplificado (campos críticos posicionales)
    // Tipo 1: 01|TipoDoc|NumDoc|RazonSocial|TipoPlanilla|NumPlanilla|FechaPlanilla
    //        |PeriodoPension|PeriodoSalud|TotalCotizantes|TotalAportes
    const tipo1 = [
      '01', // tipo registro
      'NI', // tipo documento (NIT)
      pad(employerNit, 16), // número documento
      padR(companyName, 200), // razón social
      'E', // tipo planilla (E = empleados)
      pad(`${year}${String(month).padStart(2, '0')}001`, 10), // número planilla
      new Date().toISOString().slice(0, 10), // fecha
      periodoLiquidacion, // periodo pensión
      periodoLiquidacion, // periodo salud
      pad(totalEntries, 5), // total cotizantes
      num(totalAportes, 12), // total aportes
    ].join('|');

    // ============ Registros tipo 2: Detalle por empleado ============
    const tipo2Lines: string[] = [];
    let seq = 1;
    for (const entry of period.entries) {
      const e = entry.employee;
      // Mapping de tipo documento a código PILA oficial
      const internalCode = (
        idTypeById.get(e.id_identification_type) || 'CC'
      ).toUpperCase();
      const idType = PilaService.PILA_ID_CODE[internalCode] || 'CC';
      const line = [
        '02', // tipo registro
        pad(seq, 5), // secuencia
        idType, // tipo documento
        pad(e.document_number, 16), // número documento
        padR(e.name, 60), // nombre
        padR(e.position, 20), // cargo / dependencia
        '1', // tipo cotizante (1 = dependiente)
        '0', // subtipo
        '30', // días cotizados pensión (mes)
        '30', // días cotizados salud
        num(entry.ibc, 9), // IBC
        num(entry.pension_employee + entry.pension_employer, 9), // cotización pensión
        num(entry.health_employee + entry.health_employer, 9), // cotización salud
        num(entry.arl_employer, 9), // ARL
        num(entry.caja_employer, 9), // CCF
        num(entry.sena_employer, 9), // SENA
        num(entry.icbf_employer, 9), // ICBF
      ].join('|');
      tipo2Lines.push(line);
      seq++;
    }

    const content = [tipo1, ...tipo2Lines].join('\n') + '\n';

    return {
      filename: `pila-${year}-${String(month).padStart(2, '0')}.txt`,
      content,
      summary: {
        period_id: period.id,
        cotizantes: totalEntries,
        total_gross: Math.round(totalGross),
        total_aportes: Math.round(totalAportes),
      },
    };
  }
}
