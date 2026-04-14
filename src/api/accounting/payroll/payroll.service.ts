import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { JournalAutoService } from '../journal/journal-auto.service';
import { ClosingService } from '../closing/closing.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreatePayrollPeriodDto } from './dto/create-payroll-period.dto';

// ARL rates by risk level (Colombian law)
const ARL_RATES: Record<number, number> = {
  1: 0.00522,
  2: 0.01044,
  3: 0.02436,
  4: 0.04350,
  5: 0.06960,
};

// Overtime & Surcharge rates (Colombian law)
const RATES = {
  HED: 1.25,  // Hora Extra Diurna
  HEN: 1.75,  // Hora Extra Nocturna
  HEDF: 2.00, // Hora Extra Diurna Festiva
  HENF: 2.50, // Hora Extra Nocturna Festiva
  RN: 0.35,   // Recargo Nocturno
  RF: 0.75,   // Recargo Festivo
};

@Injectable()
export class PayrollService {
  constructor(
    private prisma: PrismaService,
    private journalAutoService: JournalAutoService,
    private closingService: ClosingService,
  ) {}

  // ── Employee CRUD ──────────────────────────────────────────

  async findAllEmployees(query?: { is_active?: string }) {
    const where: any = {};
    if (query?.is_active !== undefined) {
      where.is_active = query.is_active === 'true';
    }
    return this.prisma.employee.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOneEmployee(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { payrollEntries: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!employee) {
      throw new NotFoundException(`Empleado con ID ${id} no encontrado`);
    }
    return employee;
  }

  async createEmployee(dto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: {
        document_number: dto.document_number,
        id_identification_type: dto.id_identification_type,
        name: dto.name,
        position: dto.position,
        department: dto.department,
        hire_date: new Date(dto.hire_date),
        base_salary: dto.base_salary,
        transport_allowance: dto.transport_allowance ?? 0,
        eps_entity: dto.eps_entity,
        pension_fund: dto.pension_fund,
        arl_risk_level: dto.arl_risk_level ?? 1,
        bank_name: dto.bank_name,
        bank_account: dto.bank_account,
      },
    });
  }

  async updateEmployee(id: number, dto: UpdateEmployeeDto) {
    await this.findOneEmployee(id);
    const data: any = { ...dto };
    if (dto.hire_date) {
      data.hire_date = new Date(dto.hire_date);
    }
    return this.prisma.employee.update({
      where: { id },
      data,
    });
  }

  // ── Payroll Period CRUD ────────────────────────────────────

  async findAllPeriods() {
    return this.prisma.payrollPeriod.findMany({
      include: { _count: { select: { entries: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async findOnePeriod(id: number) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id },
      include: {
        entries: {
          include: { employee: true },
          orderBy: { employee: { name: 'asc' } },
        },
      },
    });
    if (!period) {
      throw new NotFoundException(`Período de nómina con ID ${id} no encontrado`);
    }
    return period;
  }

  async createPeriod(dto: CreatePayrollPeriodDto) {
    return this.prisma.payrollPeriod.create({
      data: {
        year: dto.year,
        month: dto.month,
        period_type: dto.period_type,
        start_date: new Date(dto.start_date),
        end_date: new Date(dto.end_date),
        status: 'DRAFT',
      },
    });
  }

  // ── Calculate Payroll ──────────────────────────────────────

  async calculatePeriod(periodId: number) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: periodId },
    });
    if (!period) {
      throw new NotFoundException(`Período con ID ${periodId} no encontrado`);
    }
    if (period.status !== 'DRAFT' && period.status !== 'CALCULATED') {
      throw new BadRequestException(
        `No se puede calcular un período con estado "${period.status}". Debe estar en DRAFT o CALCULATED.`,
      );
    }

    // Delete existing entries for recalculation
    await this.prisma.payrollEntry.deleteMany({
      where: { id_payroll_period: periodId },
    });

    const employees = await this.prisma.employee.findMany({
      where: { is_active: true },
    });

    const entries: any[] = [];

    // Cargar todas las novedades del periodo, indexadas por empleado
    const novedades = await this.prisma.payrollNovedad.findMany({
      where: { id_payroll_period: periodId },
    });
    const novedadesByEmployee = new Map<number, typeof novedades>();
    for (const n of novedades) {
      if (!novedadesByEmployee.has(n.id_employee)) {
        novedadesByEmployee.set(n.id_employee, []);
      }
      novedadesByEmployee.get(n.id_employee)!.push(n);
    }

    for (const emp of employees) {
      const empNovedades = novedadesByEmployee.get(emp.id) ?? [];

      // Sumamos novedades por categoría
      let overtimeAmount = 0;
      let commissions = 0;
      let bonuses = 0;
      let otherAccruals = 0;
      let otherDeductions = 0;
      let absentDays = 0;

      for (const nov of empNovedades) {
        switch (nov.type) {
          case 'HORAS_EXTRA_DIURNAS':
          case 'HORAS_EXTRA_NOCTURNAS':
          case 'HORAS_EXTRA_DOMINICALES':
            overtimeAmount += nov.amount;
            break;
          case 'COMISION':
            commissions += nov.amount;
            break;
          case 'BONIFICACION':
          case 'INCAPACIDAD_COMUN':
          case 'INCAPACIDAD_LABORAL':
          case 'LICENCIA_REMUNERADA':
          case 'VACACIONES':
            bonuses += nov.amount;
            break;
          case 'OTRO_DEVENGADO':
            otherAccruals += nov.amount;
            break;
          case 'OTRO_DEDUCIBLE':
            otherDeductions += nov.amount;
            break;
          case 'AUSENTISMO':
          case 'LICENCIA_NO_REMUNERADA':
            absentDays += nov.quantity;
            break;
        }
      }

      const workedDays = Math.max(0, 30 - absentDays);
      const baseSalaryProrated = (emp.base_salary / 30) * workedDays;

      const grossSalary = baseSalaryProrated + emp.transport_allowance + overtimeAmount + commissions + bonuses + otherAccruals;

      // IBC (Base for social security)
      const ibc = baseSalaryProrated + overtimeAmount + commissions; 

      // Employee deductions (4% Salud, 4% Pensión)
      const healthEmployee = Math.round(ibc * 0.04);
      const pensionEmployee = Math.round(ibc * 0.04);

      // Employer contributions
      // LEY 1607: Exoneration if salary < 10 SMLMV
      const isExonerated = emp.is_exonerated && emp.base_salary < 13000000;
      
      const healthEmployer = isExonerated ? 0 : Math.round(ibc * 0.085);
      const senaEmployer = isExonerated ? 0 : Math.round(ibc * 0.02);
      const icbfEmployer = isExonerated ? 0 : Math.round(ibc * 0.03);
      
      const pensionEmployer = Math.round(ibc * 0.12);
      const arlRate = ARL_RATES[emp.arl_risk_level] || ARL_RATES[1];
      const arlEmployer = Math.round(ibc * arlRate);
      const cajaEmployer = Math.round(ibc * 0.04);

      // Provisions
      const primaProvision = Math.round(grossSalary * 0.0833);
      const cesantiasProvision = Math.round(grossSalary * 0.0833);
      const intCesantiasProvision = Math.round((cesantiasProvision * 0.12) / 12);
      const vacacionesProvision = Math.round(baseSalaryProrated * 0.0417);

      const netSalary = grossSalary - healthEmployee - pensionEmployee - otherDeductions;

      const totalEmployerCost = grossSalary + healthEmployer + pensionEmployer + 
                                arlEmployer + senaEmployer + icbfEmployer + 
                                cajaEmployer + primaProvision + cesantiasProvision + 
                                intCesantiasProvision + vacacionesProvision;

      const entry = await this.prisma.payrollEntry.create({
        data: {
          id_payroll_period: periodId,
          id_employee: emp.id,
          base_salary: emp.base_salary,
          transport_allowance: emp.transport_allowance,
          worked_days: workedDays,
          overtime_amount: overtimeAmount,
          commissions: commissions,
          bonuses: bonuses,
          other_accruals: otherAccruals,
          other_deductions: otherDeductions,
          gross_salary: grossSalary,
          ibc: ibc,
          health_employee: healthEmployee,
          pension_employee: pensionEmployee,
          health_employer: healthEmployer,
          pension_employer: pensionEmployer,
          arl_employer: arlEmployer,
          sena_employer: senaEmployer,
          icbf_employer: icbfEmployer,
          caja_employer: cajaEmployer,
          prima_provision: primaProvision,
          cesantias_provision: cesantiasProvision,
          int_cesantias_provision: intCesantiasProvision,
          vacaciones_provision: vacacionesProvision,
          net_salary: netSalary,
          total_employer_cost: totalEmployerCost,
        },
        include: { employee: true },
      });

      entries.push(entry);
    }

    // Update period status
    await this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: 'CALCULATED' },
    });

    return {
      period_id: periodId,
      status: 'CALCULATED',
      employee_count: entries.length,
      entries,
    };
  }

  // ── Approve & Generate Journal ─────────────────────────────

  async approvePeriod(periodId: number) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: periodId },
      include: { entries: true },
    });

    if (!period) {
      throw new NotFoundException(`Período con ID ${periodId} no encontrado`);
    }

    // Validate if period is closed
    const isClosed = await this.closingService.isPeriodClosed(new Date(period.year, period.month - 1, 1));
    if (isClosed) {
      throw new ForbiddenException(
        `No se puede aprobar la nómina. El periodo contable ${period.year}-${period.month} ya se encuentra cerrado.`,
      );
    }

    if (period.status !== 'CALCULATED') {
      throw new BadRequestException(
        `El período debe estar en estado CALCULATED para aprobar. Estado actual: "${period.status}"`,
      );
    }
    if (period.entries.length === 0) {
      throw new BadRequestException('No hay entradas de nómina para aprobar');
    }

    // Aggregate totals
    const totals = period.entries.reduce(
      (acc, e) => ({
        grossSalary: acc.grossSalary + e.gross_salary,
        healthEmployee: acc.healthEmployee + e.health_employee,
        pensionEmployee: acc.pensionEmployee + e.pension_employee,
        healthEmployer: acc.healthEmployer + e.health_employer,
        pensionEmployer: acc.pensionEmployer + e.pension_employer,
        arlEmployer: acc.arlEmployer + e.arl_employer,
        senaEmployer: acc.senaEmployer + e.sena_employer,
        icbfEmployer: acc.icbfEmployer + e.icbf_employer,
        cajaEmployer: acc.cajaEmployer + e.caja_employer,
        primaProvision: acc.primaProvision + e.prima_provision,
        cesantiasProvision: acc.cesantiasProvision + e.cesantias_provision,
        intCesantiasProvision: acc.intCesantiasProvision + e.int_cesantias_provision,
        vacacionesProvision: acc.vacacionesProvision + e.vacaciones_provision,
        netSalary: acc.netSalary + e.net_salary,
      }),
      {
        grossSalary: 0,
        healthEmployee: 0,
        pensionEmployee: 0,
        healthEmployer: 0,
        pensionEmployer: 0,
        arlEmployer: 0,
        senaEmployer: 0,
        icbfEmployer: 0,
        cajaEmployer: 0,
        primaProvision: 0,
        cesantiasProvision: 0,
        intCesantiasProvision: 0,
        vacacionesProvision: 0,
        netSalary: 0,
      },
    );

    // Round all totals
    for (const key of Object.keys(totals)) {
      totals[key] = Math.round(totals[key] * 100) / 100;
    }

    const totalParafiscales = Math.round(
      (totals.senaEmployer + totals.icbfEmployer + totals.cajaEmployer) * 100,
    ) / 100;

    // Generate journal entry via transaction
    const journalEntry = await this.prisma.$transaction(async (prisma) => {
      // Get next entry number
      const lastEntry = await prisma.journalEntry.findFirst({
        orderBy: { id: 'desc' },
        select: { entry_number: true },
      });
      let nextNumber = 1;
      if (lastEntry) {
        const match = lastEntry.entry_number.match(/AC-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      const entryNumber = `AC-${String(nextNumber).padStart(6, '0')}`;

      // Helper to find PUC account by code with fallback
      const findAccount = async (code: string) => {
        let account = await prisma.pucAccount.findUnique({ where: { code } });
        if (!account) {
          // Try startsWith with parent code
          const parentCode = code.substring(0, 4);
          account = await prisma.pucAccount.findFirst({
            where: { code: { startsWith: parentCode } },
            orderBy: { code: 'asc' },
          });
        }
        if (!account) {
          // Last fallback: try 2-digit class
          const classCode = code.substring(0, 2);
          account = await prisma.pucAccount.findFirst({
            where: { code: { startsWith: classCode }, level: 6 },
            orderBy: { code: 'asc' },
          });
        }
        return account;
      };

      // Build journal lines
      const lines: any[] = [];

      // DEBITS (expenses)
      const addDebit = async (code: string, description: string, amount: number) => {
        if (amount <= 0) return;
        const account = await findAccount(code);
        if (account) {
          lines.push({
            id_puc_account: account.id,
            description,
            debit: amount,
            credit: 0,
          });
        }
      };

      const addCredit = async (code: string, description: string, amount: number) => {
        if (amount <= 0) return;
        const account = await findAccount(code);
        if (account) {
          lines.push({
            id_puc_account: account.id,
            description,
            debit: 0,
            credit: amount,
          });
        }
      };

      // Debits
      await addDebit('510506', 'Sueldos y salarios', totals.grossSalary);
      await addDebit('510530', 'Cesantías provisión', totals.cesantiasProvision);
      await addDebit('510533', 'Intereses sobre cesantías', totals.intCesantiasProvision);
      await addDebit('510536', 'Prima de servicios', totals.primaProvision);
      await addDebit('510539', 'Vacaciones provisión', totals.vacacionesProvision);
      await addDebit('510568', 'Aportes EPS empleador', totals.healthEmployer);
      await addDebit('510570', 'Aportes pensión empleador', totals.pensionEmployer);
      await addDebit('510572', 'Aportes ARL', totals.arlEmployer);
      await addDebit('510575', 'Aportes parafiscales (SENA, ICBF, Caja)', totalParafiscales);

      // Credits
      await addCredit('237005', 'Aportes EPS empleado', totals.healthEmployee);
      await addCredit('237006', 'Aportes pensión empleado', totals.pensionEmployee);
      await addCredit('250505', 'Nómina por pagar', totals.netSalary);
      await addCredit('261005', 'Cesantías consolidadas', totals.cesantiasProvision);
      await addCredit('261505', 'Intereses sobre cesantías', totals.intCesantiasProvision);
      await addCredit('261010', 'Vacaciones consolidadas', totals.vacacionesProvision);
      await addCredit('237010', 'Aportes parafiscales por pagar', totalParafiscales);

      const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
      const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

      // Adjust for rounding differences
      const diff = Math.round((totalDebit - totalCredit) * 100) / 100;
      if (Math.abs(diff) > 0 && Math.abs(diff) <= 1 && lines.length > 0) {
        // Add/subtract from net salary credit to balance
        const netLine = lines.find(
          (l) => l.credit > 0 && l.description === 'Nómina por pagar',
        );
        if (netLine) {
          netLine.credit = Math.round((netLine.credit + diff) * 100) / 100;
        }
      }

      const finalDebit = Math.round(lines.reduce((s, l) => s + l.debit, 0) * 100) / 100;
      const finalCredit = Math.round(lines.reduce((s, l) => s + l.credit, 0) * 100) / 100;

      const periodLabel = `${period.year}-${String(period.month).padStart(2, '0')} (${period.period_type})`;

      const entry = await prisma.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: new Date(),
          description: `Nómina ${periodLabel}`,
          source_type: 'PAYROLL',
          source_id: period.id,
          status: 'POSTED',
          total_debit: finalDebit,
          total_credit: finalCredit,
          lines: {
            create: lines,
          },
        },
        include: {
          lines: {
            include: {
              pucAccount: true,
            },
          },
        },
      });

      return entry;
    });

    // Update period status
    await this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: 'APPROVED' },
    });

    return {
      period_id: periodId,
      status: 'APPROVED',
      journal_entry: journalEntry,
      totals,
    };
  }
}
