import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SystemAuditCronService {
  private readonly logger = new Logger(SystemAuditCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Run at 02:00 AM on the 1st day of every month
  @Cron('0 2 1 * *')
  async archiveOldAuditLogs() {
    this.logger.log('Iniciando proceso de archivado de auditoría (DLM)...');

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    try {
      // Buscar los registros viejos
      const oldLogs = await this.prisma.systemAuditLog.findMany({
        where: {
          createdAt: {
            lt: twelveMonthsAgo,
          },
        },
      });

      if (oldLogs.length === 0) {
        this.logger.log('No hay registros viejos para archivar.');
        return;
      }

      this.logger.log(`Encontrados ${oldLogs.length} registros para archivar.`);

      // Crear archivo JSON Lines local (para posible subida a S3)
      const dateString = new Date().toISOString().split('T')[0];
      const tempFileName = `audit_archive_${dateString}.jsonl`;
      const tempFilePath = path.join('/tmp', tempFileName);

      const writeStream = fs.createWriteStream(tempFilePath);
      for (const log of oldLogs) {
        const stringified = JSON.stringify({
          ...log,
          id: log.id.toString(), // BigInt to string
        });
        writeStream.write(stringified + '\n');
      }
      writeStream.end();

      // Aquí podrías agregar la integración con AWS S3 / DO Spaces
      // e.g. await s3.upload({ Bucket, Key: \`audit_logs/\${tempFileName}\`, Body: stream }).promise();

      this.logger.log(`Registros respaldados temporalmente en ${tempFilePath}`);

      // Eliminar de PostgreSQL para liberar espacio (evita colapso)
      const deleted = await this.prisma.systemAuditLog.deleteMany({
        where: {
          createdAt: {
            lt: twelveMonthsAgo,
          },
        },
      });

      this.logger.log(`Purgados ${deleted.count} registros antiguos de la base de datos.`);

      // Borrar el archivo local tras confirmación
      // fs.unlinkSync(tempFilePath);
    } catch (error) {
      this.logger.error('Error durante el archivado de auditoría', error);
    }
  }
}
