import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { DianOrchestratorService } from '../dian/dian-orchestrator.service';
import { JournalAutoService } from '../accounting/journal/journal-auto.service';

@Injectable()
export class PosSalesCronService {
  private readonly logger = new Logger(PosSalesCronService.name);
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly dianOrchestrator: DianOrchestratorService,
    private readonly journalAutoService: JournalAutoService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processQueuedPosSales() {
    if (this.isProcessing) {
      this.logger.debug('Procesamiento de POS en curso. Saltando este ciclo.');
      return;
    }
    this.isProcessing = true;

    try {
      const queuedSales = await this.prisma.posSale.findMany({
        where: { status: 'QUEUED' },
        orderBy: { createdAt: 'asc' }, // Procesar en orden de creación
        take: 10, // Procesar en lotes pequeños por minuto
      });

      if (queuedSales.length > 0) {
        this.logger.log(
          `Encontradas ${queuedSales.length} ventas POS encoladas para la DIAN.`,
        );
      }

      for (const sale of queuedSales) {
        try {
          this.logger.log(
            `Procesando Factura DIAN para PosSale #${sale.id}...`,
          );

          // Armar payload compatible con DianOrchestratorService
          const parsedLines =
            typeof sale.lines === 'string'
              ? JSON.parse(sale.lines as string)
              : sale.lines;

          // Compatibilidad: la orquestación espera array de items
          const linesForDian = Array.isArray(parsedLines) ? parsedLines.map(line => ({
             description: line.description || line.product_name || 'Producto POS',
             quantity: line.quantity || 1,
             unitPrice: line.unitPrice !== undefined ? line.unitPrice : (line.unit_price || 0),
             taxPercent: line.taxPercent !== undefined ? line.taxPercent : 19
          })) : [];

          const saleDate = sale.createdAt;
          const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' });
          const timeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
          
          const payload = {
            customerName: sale.customerName || 'Consumidor Final',
            customerDoc: sale.customerDoc || '222222222222',
            customerDocType: sale.customerDocType || '13',
            lines: linesForDian,
            paymentMethod: sale.paymentMethod,
            date: dateFormatter.format(saleDate),
            time: `${timeFormatter.format(saleDate)}-05:00`,
            // Opcional: pasar el ID de pos_sale para que la factura generada se pueda linkear
          };

          const result =
            await this.dianOrchestrator.generateAndSendInvoice(payload);

          // Si fue exitoso, actualizar el estado de la venta POS
          if (result.success) {
            await this.prisma.posSale.update({
              where: { id: sale.id },
              data: {
                status: 'INVOICED',
                id_dian_invoice: result.dianRecordId,
                dian_error_msg: null,
              },
            });
            
            // Generar el asiento contable de ingreso y costo
            try {
              await this.journalAutoService.onPosSaleCompleted(sale.id);
              this.logger.log(`Asiento contable generado exitosamente para PosSale #${sale.id}`);
            } catch (accErr) {
              this.logger.error(`Error generando asiento contable para PosSale #${sale.id}: ${accErr.message}`);
            }

            this.logger.log(
              `PosSale #${sale.id} procesado exitosamente. DIAN Invoice ID: ${result.dianRecordId}`,
            );
          } else {
            await this.prisma.posSale.update({
              where: { id: sale.id },
              data: {
                status: 'ERROR',
                id_dian_invoice: result.dianRecordId,
                dian_error_msg: result.error || 'Rechazo asíncrono DIAN',
              },
            });
            this.logger.warn(`PosSale #${sale.id} enviado pero con ERROR en DIAN: ${result.error}`);
          }
        } catch (error) {
          this.logger.error(
            `Error enviando PosSale #${sale.id} a DIAN: ${error.message}`,
          );
          await this.prisma.posSale.update({
            where: { id: sale.id },
            data: {
              status: 'ERROR',
              dian_error_msg: error.message || 'Error desconocido',
            },
          });
        }
      }
    } catch (error) {
      this.logger.error('Error fatal en PosSalesCronService:', error);
    } finally {
      this.isProcessing = false;
    }
  }
}
