import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Generación de archivo PILA (Planilla Integrada de Liquidación de Aportes)
 * en formato simplificado siguiendo la Resolución 2388/2016 del Ministerio
 * de Salud y la UGPP.
 *
 * NOTA: esta es una implementación inicial que produce los registros tipo 1
 * (encabezado) y tipo 2 (detalle empleado) con los campos clave para
 * autoliquidación. Para presentación oficial al operador PILA se recomienda
 * validar contra el último anexo técnico vigente y completar los campos
 * adicionales según las particularidades de la empresa.
 */
@Injectable()
export class PilaService {
  constructor(private readonly prisma: PrismaService) {}

  async generatePila(year: number, month: number, employerNit: string) {
    const period = (await this.prisma.payrollPeriod.findFirst({
      where: { year, month, status: 'APPROVED' },
      include: {
        entries: {
          include: { employee: true },
        },
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
    const totalGross: number = period.entries.reduce((s: number, e: any) => s + e.gross_salary, 0);
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

    // Layout simplificado (campos críticos posicionales)
    // Tipo 1: 01|TipoDoc|NumDoc|RazonSocial|TipoPlanilla|NumPlanilla|FechaPlanilla
    //        |PeriodoPension|PeriodoSalud|TotalCotizantes|TotalAportes
    const tipo1 = [
      '01',                       // tipo registro
      'NI',                       // tipo documento (NIT)
      pad(employerNit, 16),       // número documento
      padR('TWO SIX', 200),       // razón social
      'E',                        // tipo planilla (E = empleados)
      pad(`${year}${String(month).padStart(2, '0')}001`, 10), // número planilla
      new Date().toISOString().slice(0, 10), // fecha
      periodoLiquidacion,         // periodo pensión
      periodoLiquidacion,         // periodo salud
      pad(totalEntries, 5),       // total cotizantes
      num(totalAportes, 12),      // total aportes
    ].join('|');

    // ============ Registros tipo 2: Detalle por empleado ============
    const tipo2Lines: string[] = [];
    let seq = 1;
    for (const entry of period.entries) {
      const e = entry.employee;
      // Identificación (CC, TI, NIT, etc.). Mapping aproximado por id_identification_type
      const idType = 'CC';
      const line = [
        '02',                          // tipo registro
        pad(seq, 5),                   // secuencia
        idType,                        // tipo documento
        pad(e.document_number, 16),    // número documento
        padR(e.name, 60),              // nombre
        padR(e.position, 20),          // cargo / dependencia
        '1',                           // tipo cotizante (1 = dependiente)
        '0',                           // subtipo
        '30',                          // días cotizados pensión (mes)
        '30',                          // días cotizados salud
        num(entry.ibc, 9),             // IBC
        num(entry.pension_employee + entry.pension_employer, 9), // cotización pensión
        num(entry.health_employee + entry.health_employer, 9),   // cotización salud
        num(entry.arl_employer, 9),    // ARL
        num(entry.caja_employer, 9),   // CCF
        num(entry.sena_employer, 9),   // SENA
        num(entry.icbf_employer, 9),   // ICBF
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
