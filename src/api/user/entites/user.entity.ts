import { Usuario } from '@prisma/client';

export class UserEntity implements Usuario {
  code_user: number;
  login: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
