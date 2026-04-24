import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { BankReconciliationService } from './bank-reconciliation.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UploadStatementDto } from './dto/upload-statement.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounting')
export class BankReconciliationController {
  constructor(
    private readonly bankReconciliationService: BankReconciliationService,
  ) {}

  // ── Bank Accounts ─────────────────────────────────────────────

  @Get('bank-accounts')
  getBankAccounts() {
    return this.bankReconciliationService.getBankAccounts();
  }

  @Post('bank-accounts')
  createBankAccount(@Body() dto: CreateBankAccountDto) {
    return this.bankReconciliationService.createBankAccount(dto);
  }

  // ── Statement Upload & List ───────────────────────────────────

  @Post('bank-reconciliation/upload')
  uploadStatement(@Body() dto: UploadStatementDto) {
    return this.bankReconciliationService.uploadStatement(dto);
  }

  @Get('bank-reconciliation/statements')
  getStatements() {
    return this.bankReconciliationService.getStatements();
  }

  @Get('bank-reconciliation/statements/:id')
  getStatementDetail(@Param('id', ParseIntPipe) id: number) {
    return this.bankReconciliationService.getStatementDetail(id);
  }

  // ── Matching ──────────────────────────────────────────────────

  @Post('bank-reconciliation/match')
  manualMatch(
    @Body('bankTransactionId') bankTransactionId: number,
    @Body('sourceType') sourceType: string,
    @Body('sourceId') sourceId: number,
  ) {
    return this.bankReconciliationService.manualMatch(
      bankTransactionId,
      sourceType,
      sourceId,
    );
  }

  @Post('bank-reconciliation/auto-match/:statementId')
  autoMatch(@Param('statementId', ParseIntPipe) statementId: number) {
    return this.bankReconciliationService.autoMatch(statementId);
  }
}
