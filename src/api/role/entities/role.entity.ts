import { Role as RoleModel } from '@prisma/client';

export class RoleEntity implements RoleModel {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}