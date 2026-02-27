import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CreateUserAppDto } from './dto/create-user-app.schema';
import { UpdateUserAppDto } from './dto/update-user-app.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { UserApp } from '@prisma/client';

@Injectable()
export class UserAppService {
  private readonly logger = new Logger(UserAppService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un nuevo usuario.
   */
  create(createUserAppDto: CreateUserAppDto): Promise<UserApp> {
    this.logger.log(`Creating user: ${createUserAppDto.email}`);
    return this.prisma.userApp.create({
      data: createUserAppDto,
    });
  }

  /**
   * Obtiene todos los usuarios con sus roles.
   */
  findAll(): Promise<UserApp[]> {
    return this.prisma.userApp.findMany({
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Busca un usuario por su ID, incluyendo sus roles.
   * @throws NotFoundException si el usuario no se encuentra.
   */
  async findOne(id: number): Promise<UserApp> {
    const userApp = await this.prisma.userApp.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!userApp) {
      throw new NotFoundException(`UserApp con ID #${id} no encontrado.`);
    }
    return userApp;
  }

  /**
   * Actualiza un usuario existente.
   * @throws NotFoundException si el usuario no se encuentra.
   */
  async update(id: number, updateUserAppDto: UpdateUserAppDto): Promise<UserApp> {
    await this.findOne(id);
    return this.prisma.userApp.update({
      where: { id },
      data: updateUserAppDto,
    });
  }

  /**
   * Elimina un usuario existente.
   * @throws NotFoundException si el usuario no se encuentra.
   */
  async remove(id: number): Promise<UserApp> {
    await this.findOne(id);
    return this.prisma.userApp.delete({
      where: { id },
    });
  }
}
