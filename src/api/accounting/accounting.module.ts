import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { DianModule } from '../dian/dian.module';
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
import { PayrollNovedadService } from './payroll/payroll-novedad.service';
import { PilaService } from './payroll/pila.service';
import { ClosingController } from './closing/closing.controller';
import { ClosingService } from './closing/closing.service';
import { TaxReportController } from './tax/tax-report.controller';
import { TaxReportService } from './tax/tax-report.service';
import { TaxConfigController } from './tax-config/tax-config.controller';
import { TaxConfigService } from './tax-config/tax-config.service';
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
import { ProfitabilityController } from './reports/profitability.controller';
import { ProfitabilityService } from './reports/profitability.service';
import { ReconciliationController } from './reports/reconciliation.controller';
import { ReconciliationService } from './reports/reconciliation.service';
import { AccountingCronService } from './schedulers/accounting-cron.service';
import { AlertsController } from './alerts/alerts.controller';
import { AlertsService } from './alerts/alerts.service';
import { AccountingSettingsController } from './settings/settings.controller';
import { AccountingSettingsService } from './settings/settings.service';
import { CashReceiptController } from './cash-receipt/cash-receipt.controller';
import { CashReceiptService } from './cash-receipt/cash-receipt.service';
import { ManualInvoiceController } from './manual-invoice/manual-invoice.controller';
import { ManualInvoiceService } from './manual-invoice/manual-invoice.service';

@Module({
  imports: [PrismaModule, ConfigModule, DianModule],
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
    TaxConfigController,
    CashFlowController,
    AgingController,
    BudgetController,
    DepreciationController,
    FinancialIndicatorsController,
    ExportController,
    ExogenaController,
    ProfitabilityController,
    ReconciliationController,
    AlertsController,
    AccountingSettingsController,
    CashReceiptController,
    ManualInvoiceController,
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
    PayrollNovedadService,
    PilaService,
    ClosingService,
    TaxReportService,
    TaxConfigService,
    CashFlowService,
    AgingService,
    BudgetService,
    DepreciationService,
    FinancialIndicatorsService,
    ExportService,
    ExogenaService,
    ProfitabilityService,
    ReconciliationService,
    AccountingCronService,
    AlertsService,
    AccountingSettingsService,
    CashReceiptService,
    ManualInvoiceService,
  ],
  exports: [JournalAutoService, AuditService, TaxConfigService, BudgetService, AccountingSettingsService, CashReceiptService, ManualInvoiceService],
})
export class AccountingModule { }
