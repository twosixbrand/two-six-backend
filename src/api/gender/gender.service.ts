import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GenderService {
    constructor(private readonly prisma: PrismaService) { }

    findAll() {
        return this.prisma.gender.findMany();
    }
}
