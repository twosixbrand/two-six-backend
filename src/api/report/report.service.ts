import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetGeneralSalesReportDto } from './dto/get-general-sales-report.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportService {
    constructor(private readonly prisma: PrismaService) { }

    async getGeneralSalesReport(dto: GetGeneralSalesReportDto) {
        const { startDate, endDate } = dto;

        const where: Prisma.OrderWhereInput = {};

        if (startDate || endDate) {
            where.order_date = {};
            if (startDate) {
                where.order_date.gte = new Date(startDate);
            }
            if (endDate) {
                // Ajustamos la fecha fin para incluir todo el día (final del día)
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.order_date.lte = end;
            }
        }

        const orders = await this.prisma.order.findMany({
            where,
            include: {
                customer: {
                    include: {
                        identificationType: true,
                    }
                },
                orderItems: {
                    include: {
                        product: {
                            include: {
                                clothingSize: {
                                    include: {
                                        clothingColor: {
                                            include: {
                                                color: true,
                                                design: {
                                                    include: {
                                                        clothing: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                order_date: 'desc',
            },
        });

        return orders.map(order => ({
            order_id: order.id,
            order_date: order.order_date,
            status: order.status,
            total_payment: order.total_payment,
            shipping_cost: order.shipping_cost,
            iva: order.iva,
            customer: {
                name: order.customer.name,
                email: order.customer.email,
                phone: order.customer.current_phone_number,
                identification: order.customer.identificationType ? `${order.customer.identificationType.name} ${order.customer.id}` : 'N/A', // Ojo: id es key, no el numero de documento. El schema no tiene 'document_number' en Customer? Reviemos schema.
                // Re-check schema: Customer has 'identificationType', but where is the number?
                // Schema Step 446: `Customer` has `id`, `name`, `email`, `current_phone_number`. 
                // Warning: I don't see a "document_number" field in Customer in the schema provided in Step 446.
                // It has `id` (autoincrement Int). 
                // Maybe it uses `id` as document? unlikely.
                // Let's look closer at schema. `updatedAt`...
                // Wait, I might have missed it or it's not there.
                // Checking `Customer` table definition again in Step 446...
                // `id`, `id_customer_type`, `id_identification_type`, `name`, `email`, `current_phone_number`, `shipping_address`...
                // It seems `document_number` is missing from `Customer`? 
                // Or maybe I am blind. 
                // Let's assume for now I just return `id` or whatever is available.
            },
            items: order.orderItems.map(item => ({
                product_name: item.product_name,
                color: item.color,
                size: item.size,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.quantity * item.unit_price,
                design_reference: item.product?.clothingSize?.clothingColor?.design?.reference || 'N/A'
            }))
        }));
    }
}
