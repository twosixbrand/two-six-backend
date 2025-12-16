import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createAddressDto: CreateAddressDto) {
        // If this is the first address or marked as default, handle defaults
        if (createAddressDto.is_default) {
            await this.prisma.address.updateMany({
                where: { id_customer: createAddressDto.id_customer },
                data: { is_default: false },
            });
        } else {
            // If it's the first address, make it default automatically
            const count = await this.prisma.address.count({ where: { id_customer: createAddressDto.id_customer } });
            if (count === 0) {
                createAddressDto.is_default = true;
            }
        }

        return this.prisma.address.create({
            data: createAddressDto,
        });
    }

    async findAllByCustomer(customerId: number) {
        return this.prisma.address.findMany({
            where: { id_customer: customerId },
            orderBy: { is_default: 'desc' }, // Default first
        });
    }

    async findOne(id: number) {
        return this.prisma.address.findUnique({
            where: { id },
        });
    }

    async update(id: number, updateAddressDto: UpdateAddressDto) {
        if (updateAddressDto.is_default) {
            // Get the address to find the customer ID
            const address = await this.prisma.address.findUnique({ where: { id } });
            if (address) {
                await this.prisma.address.updateMany({
                    where: { id_customer: address.id_customer },
                    data: { is_default: false },
                });
            }
        }
        return this.prisma.address.update({
            where: { id },
            data: updateAddressDto,
        });
    }

    async remove(id: number) {
        return this.prisma.address.delete({
            where: { id },
        });
    }
}
