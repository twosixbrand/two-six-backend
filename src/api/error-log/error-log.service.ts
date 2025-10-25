import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateErrorLogDto } from './dto/create-error-log.dto';
import { UpdateErrorLogDto } from './dto/update-error-log.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ErrorLogService {
  constructor(private readonly prisma: PrismaService) {}

  create(createErrorLogDto: CreateErrorLogDto) {
    return this.prisma.errorLog.create({ data: createErrorLogDto });
  }

  findAll() {
    return this.prisma.errorLog.findMany();
  }

  async findOne(id: number) {
    const errorLog = await this.prisma.errorLog.findUnique({ where: { id } });
    if (!errorLog) {
      throw new NotFoundException(`ErrorLog with ID #${id} not found`);
    }
    return errorLog;
  }

  update(id: number, updateErrorLogDto: UpdateErrorLogDto) {
    return this.prisma.errorLog.update({ where: { id }, data: updateErrorLogDto });
  }

  remove(id: number) {
    return this.prisma.errorLog.delete({ where: { id } });
  }
}