// src/prisma/prisma.service.ts
import { Injectable, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    // Middleware: bloquea UPDATE/DELETE directo sobre JournalEntry con status
    // POSTED o sobre sus líneas. Correcciones deben hacerse vía
    // `JournalService.reverseEntry(id, reason)` que crea un asiento nuevo.
    //
    // Excepciones:
    // - Create (siempre permitido)
    // - Delete de entries en DRAFT (si se decide soportar drafts más adelante)
    // - Update de campos meta como createdAt/updatedAt (Prisma no los expone así).
    this.$use(async (params, next) => {
      const isJournalEntry = params.model === 'JournalEntry';
      const isJournalLine = params.model === 'JournalEntryLine';
      const mutating = [
        'update',
        'updateMany',
        'delete',
        'deleteMany',
        'upsert',
      ];

      if (
        (isJournalEntry || isJournalLine) &&
        mutating.includes(params.action)
      ) {
        // Permitimos explícitamente el flag `__allowPostedUpdate` usado sólo
        // internamente por código confiable (ej. linking de FK post-creación).
        // Si no viene, validamos inmutabilidad.
        const allowOverride = params.args?.data?.__allowPostedUpdate === true;
        if (allowOverride) {
          delete params.args.data.__allowPostedUpdate;
          return next(params);
        }

        // Para updateMany/deleteMany verificamos si el where incluye algún POSTED
        let affectedPosted = false;

        if (isJournalEntry) {
          const where: any = params.args?.where ?? {};
          // Si where especifica status != POSTED, permitimos
          if (where.status && where.status !== 'POSTED') {
            return next(params);
          }
          // Buscar si alguna fila afectada está POSTED
          const affected = await this.journalEntry.findMany({
            where,
            select: { id: true, status: true, entry_number: true },
          });
          affectedPosted = affected.some((e) => e.status === 'POSTED');
          if (affectedPosted) {
            const posted = affected
              .filter((e) => e.status === 'POSTED')
              .map((e) => e.entry_number)
              .join(', ');
            throw new ForbiddenException(
              `No se puede ${params.action} un asiento POSTED (${posted}). Use el endpoint de reverso contable.`,
            );
          }
        } else if (isJournalLine) {
          const where: any = params.args?.where ?? {};
          // Buscar líneas afectadas y verificar si su entry padre está POSTED
          const affected = await this.journalEntryLine.findMany({
            where,
            select: {
              id: true,
              journalEntry: { select: { status: true, entry_number: true } },
            },
          });
          const blocked = affected.filter(
            (l) => l.journalEntry.status === 'POSTED',
          );
          if (blocked.length > 0) {
            const nums = blocked
              .map((l) => l.journalEntry.entry_number)
              .join(', ');
            throw new ForbiddenException(
              `No se puede ${params.action} líneas de un asiento POSTED (${nums}). Use el endpoint de reverso contable.`,
            );
          }
        }
      }

      return next(params);
    });

    // Conecta a la base de datos cuando el módulo se inicializa
    await this.$connect();
  }
}
