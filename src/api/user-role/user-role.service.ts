import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserRoleService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUserRoleDto: CreateUserRoleDto) {
    return this.prisma.userRole.create({
      data: createUserRoleDto,
    });
  }

  findAll() {
    return this.prisma.userRole.findMany({
      include: {
        user: true,
        role: true,
      },
    });
  }

  async findOne(id: number) {
    const userRole = await this.prisma.userRole.findUnique({
      where: { code_user_role: id },
      include: {
        user: true,
        role: true,
      },
    });

    if (!userRole) {
      throw new NotFoundException(`UserRole con ID #${id} no encontrado.`);
    }

    return userRole;
  }

  async update(id: number, updateUserRoleDto: UpdateUserRoleDto) {
    await this.findOne(id);
    return this.prisma.userRole.update({
      where: { code_user_role: id },
      data: updateUserRoleDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.userRole.delete({
      where: { code_user_role: id },
    });
  }
}