import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NewsletterService {
    constructor(private prisma: PrismaService) { }

    async subscribe(email: string) {
        const subscriber = await this.prisma.subscriber.findUnique({
            where: { email },
        });

        if (subscriber) {
            if (!subscriber.status || subscriber.unsubscribed) {
                // Reactivate subscriber
                return this.prisma.subscriber.update({
                    where: { email },
                    data: {
                        status: true,
                        unsubscribed: false,
                    },
                });
            } else {
                throw new ConflictException('Este correo ya está suscrito a nuestro club');
            }
        }

        // Create new subscriber
        return this.prisma.subscriber.create({
            data: {
                email,
                status: true,
                unsubscribed: false,
            },
        });
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
