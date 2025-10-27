import { Role } from '@prisma/client';

export class RoleEntity implements Role {
  code_role: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
