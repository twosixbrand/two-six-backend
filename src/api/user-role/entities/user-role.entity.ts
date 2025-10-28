import { UserRole } from '@prisma/client';

export class UserRoleEntity implements UserRole {
  code_user_role: number;
  code_user: number;
  code_role: number;
  createdAt: Date;
  updatedAt: Date;
}