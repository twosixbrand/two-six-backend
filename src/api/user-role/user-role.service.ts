import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UserRoleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Asigna un rol a un usuario, verificando que ambos existan.
   * @throws NotFoundException si el usuario o el rol no se encuentran.
   */
  async create(createUserRoleDto: CreateUserRoleDto): Promise<UserRole> {
    const { id_user_app, id_role } = createUserRoleDto;

    // Verificar que el usuario y el rol existan
    const user = await this.prisma.userApp.findUnique({ where: { id: id_user_app } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID #${id_user_app} no encontrado.`);
    }

    const role = await this.prisma.role.findUnique({ where: { id: id_role } });
    if (!role) {
      throw new NotFoundException(`Rol con ID #${id_role} no encontrado.`);
    }

    return this.prisma.userRole.create({
      data: {
        id_user_app,
        id_role,
      },
    });
  }

  /**
   * Obtiene todas las asignaciones de roles con sus relaciones.
   */
  findAll(): Promise<UserRole[]> {
    return this.prisma.userRole.findMany({
      include: {
        user: true,
        role: true,
      },
    });
  }

  /**
   * Busca una asignación de rol por su ID.
   * @throws NotFoundException si la asignación no se encuentra.
   */
  async findOne(id: number): Promise<UserRole> {
    const userRole = await this.prisma.userRole.findUnique({
      where: { id },
      include: { user: true, role: true },
    });

    if (!userRole) {
      throw new NotFoundException(`Asignación de rol con ID #${id} no encontrada.`);
    }

    return userRole;
  }

  /**
   * Actualiza una asignación de rol existente.
   */
  async update(id: number, updateUserRoleDto: UpdateUserRoleDto): Promise<UserRole> {
    await this.findOne(id); // Asegura que la asignación exista
    return this.prisma.userRole.update({
      where: { id },
      data: updateUserRoleDto,
    });
  }

  /**
   * Elimina una asignación de rol existente.
   */
  async remove(id: number): Promise<UserRole> {
    await this.findOne(id); // Asegura que la asignación exista
    return this.prisma.userRole.delete({
      where: { id },
    });
  }
}