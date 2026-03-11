import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class NewsletterService {
    constructor(
        private prisma: PrismaService,
        private readonly mailerService: MailerService,
        private configService: ConfigService,
    ) { }

    private generateUniqueCode(): string {
        const randomString = crypto.randomBytes(3).toString('hex').toUpperCase();
        return `WELCOME-${randomString}`;
    }

    async subscribe(email: string) {
        let subscriber = await this.prisma.subscriber.findUnique({
            where: { email },
        });

        const storeEmail = this.configService.get<string>('EMAIL_TO');
        let isNewSubscriber = false;
        let isResubscriber = false;

        if (subscriber) {
            if (!subscriber.status || subscriber.unsubscribed) {
                // Reactivate subscriber (if they were unsubscribed but now trying again)
                subscriber = await this.prisma.subscriber.update({
                    where: { email },
                    data: {
                        status: true,
                        unsubscribed: false,
                        // We DO NOT change their existing discount_code.
                    },
                });
                isResubscriber = true;
            } else {
                throw new ConflictException('Este correo ya está suscrito a nuestro club');
            }
        } else {
            // Create new subscriber
            const discountCode = this.generateUniqueCode();
            subscriber = await this.prisma.subscriber.create({
                data: {
                    email,
                    status: true,
                    unsubscribed: false,
                    discount_code: discountCode,
                },
            });
            isNewSubscriber = true;
        }

        // Determine which email to send
        if ((isNewSubscriber || (isResubscriber && !subscriber.is_discount_used)) && subscriber.discount_code) {
            // Send email WITH the discount code
            try {
                await this.mailerService.sendMail({
                    to: email,
                    ...(storeEmail ? { bcc: storeEmail } : {}),
                    subject: isNewSubscriber
                        ? '¡Bienvenido al Club! Tu código de descuento del 10% 🖤 - Two Six'
                        : '¡Qué bueno verte de nuevo! Tu código de descuento te espera 🖤 - Two Six',
                    html: `
                    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
                        <div style="background-color: #000; padding: 40px 20px; text-align: center;">
                            <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px;">TWO SIX</h1>
                        </div>
                        
                        <div style="padding: 40px 30px;">
                            <h2 style="font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 20px;">
                                ${isNewSubscriber ? '¡Bienvenido al Club!' : '¡Qué bueno tenerte de vuelta!'}
                            </h2>
                            <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 30px;">
                                ${isNewSubscriber
                            ? 'Gracias por unirte. Estamos emocionados de tenerte con nosotros. A partir de ahora recibirás accesos anticipados y lanzamientos exclusivos.'
                            : 'Nos alegra que hayas decidido volver. Recuerda que sigues teniendo tu cupón de bienvenida disponible. A partir de ahora recibirás de nuevo accesos anticipados y exclusivos.'}
                            </p>
                            
                            <div style="background-color: #f8f8f8; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 30px;">
                                <p style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-top: 0; margin-bottom: 15px;">Tu código de 10% de descuento</p>
                                <div style="font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #000; padding: 15px; border: 2px dashed #ccc; border-radius: 4px; background: #fff; display: inline-block;">
                                    ${subscriber.discount_code}
                                </div>
                                <p style="font-size: 14px; color: #888; margin-top: 15px; margin-bottom: 0;">
                                    Usa este código en el proceso de pago. Válido para un único uso.
                                </p>
                            </div>
                            
                            <div style="text-align: center;">
                                <a href="${this.configService.get<string>('FRONTEND_URL') || 'https://two-six.co'}" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">Ir a la Tienda</a>
                            </div>
                        </div>
                        
                        <div style="background-color: #f8f8f8; border-top: 1px solid #eaeaea; padding: 20px; text-align: center;">
                            <p style="font-size: 12px; color: #999; margin: 0; line-height: 1.5;">
                                Has recibido este correo porque te suscribiste a nuestro Club.<br>
                                Si prefieres no recibir más de nuestras novedades, puedes <a href="${this.configService.get<string>('API_URL') || 'http://localhost:3050'}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}" style="color: #666; text-decoration: underline;">darte de baja aquí</a>.<br><br>
                                &copy; ${new Date().getFullYear()} Two Six. Todos los derechos reservados.
                            </p>
                        </div>
                    </div>
                  `
                });
            } catch (error) {
                console.error('Error enviando correo de bienvenida/recordatorio:', error);
            }
        } else if (isResubscriber && subscriber.is_discount_used) {
            // Send a welcome back email WITHOUT a generic code
            try {
                await this.mailerService.sendMail({
                    to: email,
                    ...(storeEmail ? { bcc: storeEmail } : {}),
                    subject: '¡Qué bueno verte de nuevo! 🖤 - Two Six',
                    html: `
                    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
                        <div style="background-color: #000; padding: 40px 20px; text-align: center;">
                            <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px;">TWO SIX</h1>
                        </div>
                        
                        <div style="padding: 40px 30px;">
                            <h2 style="font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 20px;">
                                ¡Qué bueno tenerte de vuelta!
                            </h2>
                            <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 30px;">
                                Nos alegra mucho que hayas decidido volver. A partir de ahora recibirás de nuevo accesos anticipados y lanzamientos exclusivos de nuestras colecciones directamente en tu correo. ¡Gracias por ser parte del Club!
                            </p>
                            
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="${this.configService.get<string>('FRONTEND_URL') || 'https://two-six.co'}" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">Ir a la Tienda</a>
                            </div>
                        </div>
                        
                        <div style="background-color: #f8f8f8; border-top: 1px solid #eaeaea; padding: 20px; text-align: center;">
                            <p style="font-size: 12px; color: #999; margin: 0; line-height: 1.5;">
                                Has recibido este correo porque te suscribiste a nuestro Club.<br>
                                Si prefieres no recibir más de nuestras novedades, puedes <a href="${this.configService.get<string>('API_URL') || 'http://localhost:3050'}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}" style="color: #666; text-decoration: underline;">darte de baja aquí</a>.<br><br>
                                &copy; ${new Date().getFullYear()} Two Six. Todos los derechos reservados.
                            </p>
                        </div>
                    </div>
                  `
                });
            } catch (error) {
                console.error('Error enviando correo de regreso:', error);
            }
        }

        return subscriber;
    }

    async unsubscribe(email: string) {
        const subscriber = await this.prisma.subscriber.findUnique({
            where: { email },
        });

        if (subscriber) {
            await this.prisma.subscriber.update({
                where: { email },
                data: {
                    status: false,
                    unsubscribed: true,
                },
            });
        }
    }

    findAll() {
        return this.prisma.subscriber.findMany({
            orderBy: {
                registeredAt: 'desc',
            },
        });
    }

    update(id: number, data: { status?: boolean; unsubscribed?: boolean }) {
        return this.prisma.subscriber.update({
            where: { id },
            data,
        });
    }
}
