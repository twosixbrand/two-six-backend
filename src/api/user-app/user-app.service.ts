import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserAppDto } from './dto/create-user-app.dto';
import { UpdateUserAppDto } from './dto/update-user-app.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserAppService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUserAppDto: CreateUserAppDto) {
    return this.prisma.userApp.create({
      data: createUserAppDto,
    });
  }

  findAll() {
    return this.prisma.userApp.findMany();
  }

  async findOne(id: number) {
    const userApp = await this.prisma.userApp.findUnique({
      where: { code_user: id },
    });

    if (!userApp) {
      throw new NotFoundException(`UserApp con ID #${id} no encontrado.`);
    }

    return userApp;
  }

  async update(id: number, updateUserAppDto: UpdateUserAppDto) {
    await this.findOne(id);
    return this.prisma.userApp.update({
      where: { code_user: id },
      data: updateUserAppDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.userApp.delete({
      where: { code_user: id },
    });
  }
}
