/**
 * Tests para JournalService.reverseEntry — integridad de asientos POSTED.
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JournalService } from './journal.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ClosingService } from '../closing/closing.service';

describe('JournalService.reverseEntry', () => {
  let service: JournalService;
  let prismaMock: any;
  let auditMock: any;
  let closingMock: any;

  const postedEntry = {
    id: 10,
    entry_number: 'AC-000010',
    status: 'POSTED',
    source_type: 'SALE',
    total_debit: 100,
    total_credit: 100,
    lines: [
      { id_puc_account: 1, description: 'Bancos', debit: 100, credit: 0 },
      { id_puc_account: 2, description: 'Ingresos', debit: 0, credit: 100 },
    ],
  };

  beforeEach(async () => {
    prismaMock = {
      journalEntry: {
        findUnique: jest.fn(),
        findFirst: jest.fn().mockResolvedValue({ entry_number: 'AC-000011' }),
        create: jest
          .fn()
          .mockImplementation(({ data }: any) =>
            Promise.resolve({ id: 11, ...data, lines: data.lines.create }),
          ),
      },
      $queryRawUnsafe: jest.fn().mockRejectedValue(new Error('no seq in test')),
    };
    auditMock = { log: jest.fn().mockResolvedValue(undefined) };
    closingMock = { isPeriodClosed: jest.fn().mockResolvedValue(false) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
        { provide: ClosingService, useValue: closingMock },
      ],
    }).compile();
    service = module.get(JournalService);
  });

  it('lanza NotFound si el asiento no existe', async () => {
    prismaMock.journalEntry.findUnique.mockResolvedValue(null);
    await expect(service.reverseEntry(999, 'Motivo')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('requiere un motivo no vacío', async () => {
    await expect(service.reverseEntry(10, '  ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rechaza asientos que no estén POSTED', async () => {
    prismaMock.journalEntry.findUnique.mockResolvedValue({
      ...postedEntry,
      status: 'DRAFT',
    });
    await expect(service.reverseEntry(10, 'Motivo')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('no permite reversar un reverso', async () => {
    prismaMock.journalEntry.findUnique.mockResolvedValue({
      ...postedEntry,
      source_type: 'REVERSAL',
    });
    await expect(service.reverseEntry(10, 'Motivo')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('respeta el cierre de periodo', async () => {
    prismaMock.journalEntry.findUnique.mockResolvedValue(postedEntry);
    closingMock.isPeriodClosed.mockResolvedValue(true);
    await expect(service.reverseEntry(10, 'Motivo')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('crea un asiento nuevo con líneas invertidas y source_type REVERSAL', async () => {
    prismaMock.journalEntry.findUnique.mockResolvedValue(postedEntry);

    const result = await service.reverseEntry(10, 'Error de digitación', 99);

    expect(prismaMock.journalEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source_type: 'REVERSAL',
          source_id: 10,
          status: 'POSTED',
          total_debit: 100, // original.total_credit
          total_credit: 100, // original.total_debit
          description: expect.stringContaining('REVERSO AC-000010'),
          created_by: 99,
          lines: {
            create: [
              expect.objectContaining({ debit: 0, credit: 100 }), // invertido
              expect.objectContaining({ debit: 100, credit: 0 }), // invertido
            ],
          },
        }),
      }),
    );
    expect(auditMock.log).toHaveBeenCalledWith(
      'REVERSE',
      'JOURNAL_ENTRY',
      11,
      expect.any(String),
      99,
    );
  });
});
