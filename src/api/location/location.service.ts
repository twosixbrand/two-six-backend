import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LocationService {
    constructor(private prisma: PrismaService) { }

    async getDepartments() {
        return this.prisma.department.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async getCities(departmentId: number, activeOnly: boolean = false) {
        const where: any = { id_department: departmentId };
        if (activeOnly) {
            where.active = true;
        }
        return this.prisma.city.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }

    async updateDepartment(id: number, data: { name?: string }) {
        return this.prisma.department.update({
            where: { id },
            data,
        });
    }

    async updateCity(id: number, data: { active?: boolean; shipping_cost?: number }) {
        return this.prisma.city.update({
            where: { id },
            data,
        });
    }
}
