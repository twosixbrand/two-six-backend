import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateErrorLogDto } from './dto/create-error-log.dto';
import { UpdateErrorLogDto } from './dto/update-error-log.dto';
import { ErrorLog } from '@prisma/client';

@Injectable()
export class ErrorLogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un nuevo log de error.
   */
  create(createErrorLogDto: CreateErrorLogDto): Promise<ErrorLog> {
    return this.prisma.errorLog.create({
      data: createErrorLogDto,
    });
  }

  /**
   * Obtiene todos los logs de error.
   */
  findAll(): Promise<ErrorLog[]> {
    return this.prisma.errorLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Busca un log de error por su ID.
   * @throws NotFoundException si el log no se encuentra.
   */
  async findOne(id: number): Promise<ErrorLog> {
    const errorLog = await this.prisma.errorLog.findUnique({
      where: { id },
    });

    if (!errorLog) {
      throw new NotFoundException(`Log de error con ID #${id} no encontrado.`);
    }

    return errorLog;
  }

  /**
   * Actualiza un log de error existente.
   * @throws NotFoundException si el log no se encuentra.
   */
  async update(id: number, updateErrorLogDto: UpdateErrorLogDto): Promise<ErrorLog> {
    await this.findOne(id); // Asegura que el log exista
    return this.prisma.errorLog.update({
      where: { id },
      data: updateErrorLogDto,
    });
  }

  /**
   * Elimina un log de error existente.
   * @throws NotFoundException si el log no se encuentra.
   */
  async remove(id: number): Promise<ErrorLog> {
    await this.findOne(id); // Asegura que el log exista
    return this.prisma.errorLog.delete({
      where: { id },
    });
  }
}