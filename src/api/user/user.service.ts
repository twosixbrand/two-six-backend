import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    return this.prisma.usuario.create({
      data: createUserDto,
    });
  }

  findAll() {
    return this.prisma.usuario.findMany();
  }

  async findOne(id: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { code_user: id },
    });

    if (!user) {
      throw new NotFoundException(`User con ID #${id} no encontrado.`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id);
    return this.prisma.usuario.update({
      where: { code_user: id },
      data: updateUserDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.usuario.delete({
      where: { code_user: id },
    });
  }
}
