import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { PucController } from './puc/puc.controller';
import { PucService } from './puc/puc.service';
import { JournalController } from './journal/journal.controller';
import { JournalService } from './journal/journal.service';
import { JournalAutoService } from './journal/journal-auto.service';
import { ExpenseController } from './expense/expense.controller';
import { ExpenseService } from './expense/expense.service';
import { AccountingReportController } from './reports/accounting-report.controller';
import { AccountingReportService } from './reports/accounting-report.service';
import { BankReconciliationController } from './bank-reconciliation/bank-reconciliation.controller';
import { BankReconciliationService } from './bank-reconciliation/bank-reconciliation.service';
import { WithholdingController } from './withholding/withholding.controller';
import { WithholdingService } from './withholding/withholding.service';
import { AuditController } from './audit/audit.controller';
import { AuditService } from './audit/audit.service';
import { AccountingDashboardController } from './dashboard/accounting-dashboard.controller';
import { AccountingDashboardService } from './dashboard/accounting-dashboard.service';
import { PayrollController } from './payroll/payroll.controller';
import { PayrollService } from './payroll/payroll.service';
import { ClosingController } from './closing/closing.controller';
import { ClosingService } from './closing/closing.service';
import { TaxReportController } from './tax/tax-report.controller';
import { TaxReportService } from './tax/tax-report.service';
import { CashFlowController } from './reports/cash-flow.controller';
import { CashFlowService } from './reports/cash-flow.service';
import { AgingController } from './reports/aging.controller';
import { AgingService } from './reports/aging.service';
import { BudgetController } from './budget/budget.controller';
import { BudgetService } from './budget/budget.service';
import { DepreciationController } from './depreciation/depreciation.controller';
import { DepreciationService } from './depreciation/depreciation.service';
import { FinancialIndicatorsController } from './reports/financial-indicators.controller';
import { FinancialIndicatorsService } from './reports/financial-indicators.service';
import { ExportController } from './export/export.controller';
import { ExportService } from './export/export.service';
import { ExogenaController } from './exogena/exogena.controller';
import { ExogenaService } from './exogena/exogena.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [
    PucController,
    JournalController,
    ExpenseController,
    AccountingReportController,
    BankReconciliationController,
    WithholdingController,
    AuditController,
    AccountingDashboardController,
    PayrollController,
    ClosingController,
    TaxReportController,
    CashFlowController,
    AgingController,
    BudgetController,
    DepreciationController,
    FinancialIndicatorsController,
    ExportController,
    ExogenaController,
  ],
  providers: [
    PucService,
    JournalService,
    JournalAutoService,
    ExpenseService,
    AccountingReportService,
    BankReconciliationService,
    WithholdingService,
    AuditService,
    AccountingDashboardService,
    PayrollService,
    ClosingService,
    TaxReportService,
    CashFlowService,
    AgingService,
    BudgetService,
    DepreciationService,
    FinancialIndicatorsService,
    ExportService,
    ExogenaService,
  ],
  exports: [JournalAutoService, AuditService],
})
export class AccountingModule { }
