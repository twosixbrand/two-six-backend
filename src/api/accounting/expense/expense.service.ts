import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JournalAutoService } from '../journal/journal-auto.service';
import { AuditService } from '../audit/audit.service';
import { ClosingService } from '../closing/closing.service';
import { WithholdingService } from '../withholding/withholding.service';

@Injectable()
export class ExpenseService {
  constructor(
    private prisma: PrismaService,
    private readonly journalAutoService: JournalAutoService,
    private readonly auditService: AuditService,
    private readonly closingService: ClosingService,
    private readonly withholdingService: WithholdingService,
  ) {}

  async findAll(query: {
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (query.category) {
      where.id_expense_category = parseInt(query.category, 10);
    }

    if (query.status) {
      where.payment_status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.expense_date = {};
      if (query.startDate) {
        where.expense_date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.expense_date.lte = new Date(query.endDate);
      }
    }

    return this.prisma.expense.findMany({
      where,
      include: {
        expenseCategory: true,
        pucAccount: true,
        provider: true,
      },
      orderBy: { expense_date: 'desc' },
    });
  }

  async getCategories() {
    return this.prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        expenseCategory: true,
        pucAccount: true,
        provider: true,
      },
    });

    if (!expense) {
      throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
    }

    return expense;
  }

  async create(dto: CreateExpenseDto) {
    const expenseDate = new Date(dto.expense_date);

    // Validate if period is closed
    const isClosed = await this.closingService.isPeriodClosed(expenseDate);
    if (isClosed) {
      throw new ForbiddenException(
        `No se puede registrar el gasto. El periodo contable ${expenseDate.getFullYear()}-${expenseDate.getMonth() + 1} ya se encuentra cerrado.`,
      );
    }

    // Generate sequential expense_number
    const lastExpense = await this.prisma.expense.findFirst({
      orderBy: { id: 'desc' },
      select: { expense_number: true },
    });

    let nextNumber = 1;
    if (lastExpense) {
      const match = lastExpense.expense_number.match(/EG-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const expenseNumber = `EG-${String(nextNumber).padStart(6, '0')}`;

    const expense = await this.prisma.expense.create({
      data: {
        expense_number: expenseNumber,
        id_expense_category: dto.id_expense_category,
        id_puc_account: dto.id_puc_account,
        id_provider: dto.id_provider,
        invoice_number: dto.invoice_number,
        description: dto.description,
        subtotal: dto.subtotal,
        tax_amount: dto.tax_amount ?? 0,
        retention_amount: dto.retention_amount ?? 0,
        total: dto.total,
        expense_date: new Date(dto.expense_date),
        due_date: dto.due_date ? new Date(dto.due_date) : null,
        payment_status: 'PENDING',
        attachment_url: dto.attachment_url,
        notes: dto.notes,
      },
      include: {
        expenseCategory: true,
        pucAccount: true,
        provider: true,
      },
    });

    // Auto-generate journal entry
    try {
      await this.journalAutoService.onExpenseCreated(expense.id);
    } catch (error) {
      console.error(
        'Error generando asiento contable automático para gasto:',
        error.message,
      );
    }

    // Audit log
    try {
      await this.auditService.log(
        'CREATE',
        'EXPENSE',
        expense.id,
        JSON.stringify({
          expense_number: expense.expense_number,
          total: expense.total,
          description: expense.description,
          category: expense.expenseCategory?.name,
        }),
      );
    } catch (err) {
      console.error('Error registrando auditoría de gasto:', err.message);
    }

    return expense;
  }

  async update(id: number, dto: UpdateExpenseDto) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });

    if (!expense) {
      throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
    }

    // Validate if period is closed
    const isClosed = await this.closingService.isPeriodClosed(
      expense.expense_date,
    );
    if (isClosed) {
      throw new ForbiddenException(
        `No se puede modificar el gasto. El periodo contable ya se encuentra cerrado.`,
      );
    }

    return this.prisma.expense.update({
      where: { id },
      data: {
        ...dto,
        expense_date: dto.expense_date ? new Date(dto.expense_date) : undefined,
        due_date: dto.due_date ? new Date(dto.due_date) : undefined,
      },
      include: {
        expenseCategory: true,
        pucAccount: true,
        provider: true,
      },
    });
  }

  async markAsPaid(id: number, paymentMethod: string, paymentDate: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });

    if (!expense) {
      throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
    }

    if (expense.payment_status === 'PAID') {
      throw new BadRequestException('Este gasto ya fue marcado como pagado');
    }

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        payment_status: 'PAID',
        payment_method: paymentMethod,
        payment_date: new Date(paymentDate),
      },
      include: {
        expenseCategory: true,
        pucAccount: true,
        provider: true,
      },
    });

    // Audit log
    try {
      await this.auditService.log(
        'UPDATE',
        'EXPENSE',
        id,
        JSON.stringify({
          action: 'MARK_AS_PAID',
          expense_number: expense.expense_number,
          payment_method: paymentMethod,
          payment_date: paymentDate,
          old_status: expense.payment_status,
          new_status: 'PAID',
        }),
      );
    } catch (err) {
      console.error(
        'Error registrando auditoría de pago de gasto:',
        err.message,
      );
    }

    // Auto-regenera certificados de retención del año del pago.
    // Best-effort: si falla no bloquea el pago. Es idempotente
    // (deleteMany + recreate del año completo).
    try {
      const year = new Date(paymentDate).getFullYear();
      await this.withholdingService.generateFromExpenses(year);
    } catch (err: any) {
      console.error(
        `Error regenerando certificados de retención para el año del gasto ${id}: ${err.message}`,
      );
    }

    return updated;
  }

  async remove(id: number) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });

    if (!expense) {
      throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
    }

    // Delete associated journal entry if it exists
    const journalEntry = await this.prisma.journalEntry.findFirst({
      where: {
        source_type: 'EXPENSE',
        source_id: id,
      },
    });

    if (journalEntry) {
      await this.prisma.journalEntry.delete({
        where: { id: journalEntry.id },
      });
    }

    const deleted = await this.prisma.expense.delete({ where: { id } });

    // Audit log
    try {
      await this.auditService.log(
        'DELETE',
        'EXPENSE',
        id,
        JSON.stringify({
          expense_number: expense.expense_number,
          total: expense.total,
          description: expense.description,
        }),
      );
    } catch (err) {
      console.error(
        'Error registrando auditoría de eliminación de gasto:',
        err.message,
      );
    }

    return deleted;
  }
}
