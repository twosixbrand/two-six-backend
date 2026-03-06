import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePqrDto } from './dto/create-pqr.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PqrService {
    constructor(
        private prisma: PrismaService,
        private mailerService: MailerService
    ) { }

    async create(createPqrDto: CreatePqrDto) {
        // 1. Generate Radicado conditionally
        let prefix = 'REQ'; // Fallback
        switch (createPqrDto.type) {
            case 'Petición': prefix = 'PET'; break;
            case 'Queja': prefix = 'QUE'; break;
            case 'Reclamo': prefix = 'REC'; break;
            case 'Sugerencia': prefix = 'SUG'; break;
            case 'Cambio / Derecho de Retracto': prefix = 'CDR'; break;
        }

        const shortYear = new Date().getFullYear().toString().slice(-2);

        const countQuery = await this.prisma.pqr.count({
            where: {
                radicado: {
                    startsWith: `${prefix}${shortYear}-`,
                },
            },
        });

        const sequentialNumber = (countQuery + 1).toString().padStart(3, '0');
        const radicado = `${prefix}${shortYear}-${sequentialNumber}`;

        // 2. Save to DB
        const newPqr = await this.prisma.pqr.create({
            data: {
                ...createPqrDto,
                radicado,
                status: 'Abierto',
            },
        });

        // 3. Send confirmation email
        await this.sendConfirmationEmail(newPqr);

        return {
            message: 'PQR radicada con éxito',
            radicado: newPqr.radicado,
            data: newPqr,
        };
    }

    async findAll() {
        const pqrs = await this.prisma.pqr.findMany({
            orderBy: { createdAt: 'desc' },
        });

        // Add visual SLA warnings (15 business days roughly = 21 calendar days)
        const now = new Date();
        return pqrs.map(pqr => {
            const msDiff = now.getTime() - new Date(pqr.createdAt).getTime();
            const daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));

            let slaStatus = 'OK';
            if (pqr.status !== 'Resuelto' && pqr.status !== 'Cerrado') {
                if (daysDiff >= 15) {
                    slaStatus = 'VENCIDO';
                } else if (daysDiff >= 10) {
                    slaStatus = 'EN RIESGO';
                }
            }

            return {
                ...pqr,
                daysOpen: daysDiff,
                slaStatus,
            };
        });
    }

    async findOne(id: number) {
        const pqr = await this.prisma.pqr.findUnique({
            where: { id },
        });
        if (!pqr) {
            throw new BadRequestException('PQR no encontrada');
        }
        return pqr;
    }

    async updateStatus(id: number, status: string) {
        return this.prisma.pqr.update({
            where: { id },
            data: { status },
        });
    }

    private async sendConfirmationEmail(pqr: any) {
        try {
            const subject = `Recepción de PQR - Radicado ${pqr.radicado}`;
            const template = `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
          <h2>Hola, ${pqr.customer_name}</h2>
          <p>Hemos recibido tu solicitud de tipo <strong>${pqr.type}</strong> en Two Six.</p>
          <p>Tu número de radicado para seguimiento es: <strong>${pqr.radicado}</strong></p>
          <p>De acuerdo con la normatividad colombiana, daremos respuesta a tu solicitud en un plazo máximo de <strong>15 días hábiles</strong>.</p>
          <br/>
          <p>Detalle de tu solicitud:</p>
          <blockquote style="background: #f9f9f9; padding: 10px; border-left: 4px solid #333;">
            ${pqr.description}
          </blockquote>
          <br/>
          <p>Atentamente,<br/>El equipo de Two Six</p>
        </div>
      `;

            // Use the existing email sender configured in the backend
            await this.mailerService.sendMail({
                to: pqr.customer_email,
                subject: subject,
                html: template
            });
        } catch (error) {
            console.error('Error sending PQR confirmation email:', error);
            // We don't throw to avoid failing the creation if email fails
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_8AM)
    async checkRiskSlasAndNotify() {
        const openPqrs = await this.prisma.pqr.findMany({
            where: {
                status: {
                    notIn: ['Resuelto', 'Cerrado'],
                },
                slaRiskAlertSent: false,
            },
        });

        const now = new Date();
        for (const pqr of openPqrs) {
            const msDiff = now.getTime() - new Date(pqr.createdAt).getTime();
            const daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));

            if (daysDiff >= 10) {
                // Envía el correo al equipo interno de Two Six
                await this.sendSlaRiskEmail(pqr);
                // Actualiza la bandera en DB para no mandar el mismo correo cada día
                await this.prisma.pqr.update({
                    where: { id: pqr.id },
                    data: { slaRiskAlertSent: true },
                });
            }
        }
    }

    private async sendSlaRiskEmail(pqr: any) {
        try {
            const subject = `PQR Two Six ${pqr.radicado} Proximo a vencer`;
            const template = `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
          <h2>⚠️ Alerta Automática SLA - En Riesgo ⚠️</h2>
          <p>La siguiente petición ha alcanzado o superado los <strong>10 días</strong> desde su radicación y se encuentra próxima a vencer los plazos legales (Estado color Naranja/Amarillo en el CMS).</p>
          <ul style="background: #fdfdfd; border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
            <li><strong>Radicado:</strong> ${pqr.radicado}</li>
            <li><strong>Cliente:</strong> ${pqr.customer_name} (ID: ${pqr.customer_id})</li>
            <li><strong>Tipo:</strong> ${pqr.type}</li>
            <li><strong>Fecha de Radicación:</strong> ${new Date(pqr.createdAt).toLocaleDateString()}</li>
          </ul>
          <h3>Detalle del Requerimiento Original:</h3>
          <blockquote style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; font-size: 14px;">
            ${pqr.description}
          </blockquote>
          <br/>
          <p>Se recomienda gestionar este caso a la brevedad dentro del administrador <a href="https://twosixweb.com/cms">CMS Two Six</a>.</p>
        </div>
      `;

            await this.mailerService.sendMail({
                // El correo de Two Six configurado para recibir la alerta:
                to: 'twosixmarca@gmail.com',
                subject: subject,
                html: template,
            });
        } catch (error) {
            console.error('Error enviando alerta de SLA (Cron):', error);
        }
    }
}
