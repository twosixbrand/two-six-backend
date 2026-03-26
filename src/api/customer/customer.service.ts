import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.customer.findMany({
            include: {
                customerType: true,
                identificationType: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: number) {
        return this.prisma.customer.findUnique({
            where: { id },
            include: {
                customerType: true,
                identificationType: true,
            },
        });
    }

    async update(id: number, updateCustomerDto: UpdateCustomerDto) {
        return this.prisma.customer.update({
            where: { id },
            data: updateCustomerDto,
        });
    }
}
