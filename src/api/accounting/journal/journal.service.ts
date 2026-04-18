import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { AuditService } from '../audit/audit.service';
import { ClosingService } from '../closing/closing.service';

@Injectable()
export class JournalService {
  constructor(
    private prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly closingService: ClosingService,
  ) { }

  /**
   * Genera el próximo entry_number atómicamente vía Postgres sequence.
   * Elimina la race condition del antiguo MAX()+1.
   */
  private async getNextEntryNumber(): Promise<string> {
    try {
      const result: Array<{ nextval: bigint | number }> =
        await this.prisma.$queryRawUnsafe(`SELECT nextval('journal_entry_number_seq')`);
      const n = Number(result[0].nextval);
      return `AC-${String(n).padStart(6, '0')}`;
    } catch (_err) {
      // Fallback solo para entornos sin la sequence (tests con mocks)
      const lastEntry = await this.prisma.journalEntry.findFirst({
        orderBy: { id: 'desc' },
        select: { entry_number: true },
      });
      let nextNumber = 1;
      if (lastEntry) {
        const match = lastEntry.entry_number.match(/AC-(\d+)/);
        if (match) nextNumber = parseInt(match[1], 10) + 1;
      }
      return `AC-${String(nextNumber).padStart(6, '0')}`;
    }
  }

  /**
   * Genera un asiento reverso: toma un asiento POSTED existente y crea un nuevo
   * asiento que invierte todas sus líneas (débitos ↔ créditos), con source_type
   * 'REVERSAL' y source_id = id del asiento original.
   *
   * El asiento original NO se toca (POSTED es inmutable). La corrección queda
   * documentada como un nuevo asiento con trazabilidad completa.
   */
  async reverseEntry(id: number, reason: string, userId?: number) {
    if (!reason?.trim()) {
      throw new BadRequestException('Debes indicar el motivo del reverso.');
    }

    const original = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!original) {
      throw new NotFoundException(`Asiento contable #${id} no encontrado`);
    }
    if (original.status !== 'POSTED') {
      throw new BadRequestException(
        `Solo se pueden reversar asientos POSTED (estado actual: ${original.status}).`,
      );
    }
    if (original.source_type === 'REVERSAL') {
      throw new BadRequestException('No se puede reversar un asiento que ya es un reverso.');
    }

    const entryDate = new Date();
    const isClosed = await this.closingService.isPeriodClosed(entryDate);
    if (isClosed) {
      throw new ForbiddenException('No se puede reversar en un periodo contable cerrado.');
    }

    const entryNumber = await this.getNextEntryNumber();

    const entry = await this.prisma.journalEntry.create({
      data: {
        entry_number: entryNumber,
        entry_date: entryDate,
        description: `REVERSO ${original.entry_number}: ${reason}`,
        source_type: 'REVERSAL',
        source_id: original.id,
        status: 'POSTED',
        total_debit: original.total_credit, // invertido
        total_credit: original.total_debit, // invertido
        created_by: userId,
        lines: {
          create: original.lines.map((line) => ({
            id_puc_account: line.id_puc_account,
            description: `REVERSO: ${line.description ?? ''}`,
            debit: line.credit, // invertido
            credit: line.debit, // invertido
          })),
        },
      },
      include: {
        lines: { include: { pucAccount: true } },
      },
    });

    try {
      await this.auditService.log(
        'REVERSE',
        'JOURNAL_ENTRY',
        entry.id,
        JSON.stringify({
          original_entry_number: original.entry_number,
          original_entry_id: original.id,
          reason,
          new_entry_number: entry.entry_number,
        }),
        userId,
      );
    } catch (err) {
      console.error('Error registrando auditoría del reverso:', err.message);
    }

    return entry;
  }

  async findAll(query: { startDate?: string; endDate?: string; source_type?: string }) {
    const where: any = {};

    if (query.startDate || query.endDate) {
      where.entry_date = {};
      if (query.startDate) {
        where.entry_date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.entry_date.lte = new Date(query.endDate);
      }
    }

    if (query.source_type) {
      where.source_type = query.source_type;
    }

    return this.prisma.journalEntry.findMany({
      where,
      include: {
        lines: {
          include: {
            pucAccount: true,
          },
        },
      },
      orderBy: { entry_date: 'desc' },
    });
  }

  async findOne(id: number) {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            pucAccount: true,
          },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Asiento contable con ID ${id} no encontrado`);
    }

    return entry;
  }

  async create(dto: CreateJournalEntryDto) {
    const entryDate = new Date(dto.entry_date);
    
    // Validate if period is closed
    const isClosed = await this.closingService.isPeriodClosed(entryDate);
    if (isClosed) {
      throw new ForbiddenException(
        `No se puede registrar el asiento. El periodo contable ${entryDate.getFullYear()}-${entryDate.getMonth() + 1} ya se encuentra cerrado.`,
      );
    }

    // Validate SUM(debit) == SUM(credit)
    const totalDebit = dto.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = dto.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `La partida doble no cuadra: Débitos (${totalDebit}) != Créditos (${totalCredit})`,
      );
    }

    // Validate that all accounts allow movements (leaf accounts)
    const accountIds = dto.lines.map((l) => l.id_puc_account);
    const accounts = await this.prisma.pucAccount.findMany({
      where: { id: { in: accountIds } },
    });

    for (const account of accounts) {
      if (!account.accepts_movements) {
        throw new BadRequestException(
          `La cuenta PUC ${account.code} - ${account.name} es una cuenta mayor y no acepta movimientos directos. Use una cuenta de detalle (auxiliar).`,
        );
      }
      if (!account.is_active) {
        throw new BadRequestException(
          `La cuenta PUC ${account.code} - ${account.name} se encuentra inactiva.`,
        );
      }
    }

    // Genera entry_number atómicamente usando Postgres sequence
    // (evita race conditions que producían violaciones de unique constraint).
    const entryNumber = await this.getNextEntryNumber();

    const entry = await this.prisma.$transaction(async (prisma) => {
      const entry = await prisma.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: new Date(dto.entry_date),
          description: dto.description,
          source_type: dto.source_type,
          source_id: dto.source_id,
          status: dto.status || 'POSTED',
          total_debit: totalDebit,
          total_credit: totalCredit,
          created_by: dto.created_by,
          metadata: dto.metadata,
          lines: {
            create: dto.lines.map((line) => ({
              id_puc_account: line.id_puc_account,
              description: line.description,
              debit: line.debit,
              credit: line.credit,
            })),
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

    // Audit log
    try {
      await this.auditService.log(
        'CREATE',
        'JOURNAL_ENTRY',
        entry.id,
        JSON.stringify({
          entry_number: entry.entry_number,
          source_type: entry.source_type,
          total_debit: entry.total_debit,
          total_credit: entry.total_credit,
          description: entry.description,
        }),
        dto.created_by ?? undefined,
      );
    } catch (err) {
      console.error('Error registrando auditoría de asiento contable:', err.message);
    }

    return entry;
  }
}
