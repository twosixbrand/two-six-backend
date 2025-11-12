import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un nuevo rol.
   */
  create(createRoleDto: CreateRoleDto): Promise<Role> {
    return this.prisma.role.create({
      data: createRoleDto,
    });
  }

  /**
   * Obtiene todos los roles.
   */
  findAll(): Promise<Role[]> {
    return this.prisma.role.findMany();
  }

  /**
   * Busca un rol por su ID.
   * @throws NotFoundException si el rol no se encuentra.
   */
  async findOne(id: number): Promise<Role> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Rol con ID #${id} no encontrado.`);
    }

    return role;
  }

  /**
   * Actualiza un rol existente.
   * @throws NotFoundException si el rol no se encuentra.
   */
  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    await this.findOne(id); // Asegura que el rol exista
    return this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });
  }

  /**
   * Elimina un rol existente.
   * @throws NotFoundException si el rol no se encuentra.
   */
  async remove(id: number): Promise<Role> {
    await this.findOne(id); // Asegura que el rol exista
    return this.prisma.role.delete({
      where: { id },
    });
  }
}
