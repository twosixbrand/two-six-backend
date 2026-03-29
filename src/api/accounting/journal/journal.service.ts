import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class JournalService {
  constructor(
    private prisma: PrismaService,
    private readonly auditService: AuditService,
  ) { }

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
    // Validate SUM(debit) == SUM(credit)
    const totalDebit = dto.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = dto.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `La partida doble no cuadra: Débitos (${totalDebit}) != Créditos (${totalCredit})`,
      );
    }

    // Generate sequential entry_number
    const lastEntry = await this.prisma.journalEntry.findFirst({
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
