// src/prisma/prisma.service.ts
import { Injectable, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly cls: ClsService) {
    super();
  }

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

    // Auditoría global: intercepta create, update, delete
    this.$use(async (params, next) => {
      // Evitar recursión o auditar logs
      if (params.model === 'SystemAuditLog' || params.model === 'ErrorLog' || params.model === 'AccountingAuditLog') {
        return next(params);
      }

      const mutating = ['create', 'update', 'delete', 'upsert'];
      if (!mutating.includes(params.action)) {
        return next(params);
      }

      const userId = this.cls.get('userId') ?? null;
      let actionName = params.action.toUpperCase();

      let oldValues = null;
      let newValues = null;
      let recordId = '';

      // Si es update o delete, capturar el estado anterior
      if (['update', 'delete'].includes(params.action) && params.args?.where) {
        try {
          const previous = await (this as any)[params.model].findUnique({
            where: params.args.where,
          });
          oldValues = previous;
        } catch (err) {
          // Si no se encuentra, ignorar
        }
      }

      // Ejecutar la operación real
      const result = await next(params);

      // Extraer record ID y newValues
      if (result) {
        recordId = String(result.id || result.code || result.uuid || 'unknown');
        if (['create', 'update', 'upsert'].includes(params.action)) {
          newValues = result;
        }
      }

      // Guardar en la tabla de auditoría (sin bloquear el flujo principal si falla)
      if (recordId !== 'unknown') {
        // En un upsert, si no había oldValues es CREATE, sino UPDATE
        if (params.action === 'upsert') {
          actionName = oldValues ? 'UPDATE' : 'CREATE';
        }

        this.systemAuditLog.create({
          data: {
            tableName: params.model,
            recordId,
            action: actionName,
            userId: userId ? Number(userId) : null,
            oldValues: oldValues ? (oldValues as any) : undefined,
            newValues: newValues ? (newValues as any) : undefined,
          },
        }).catch(err => {
            console.error('Error guardando en SystemAuditLog:', err.message);
        });
      }

      return result;
    });

    // Conecta a la base de datos cuando el módulo se inicializa
    await this.$connect();
  }
}
