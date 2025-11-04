import { Role, UserApp, UserRole as UserRoleModel } from '@prisma/client';

export class UserRoleEntity implements UserRoleModel {
  id: number;
  id_user_app: number;
  id_role: number;
  createdAt: Date;
  updatedAt: Date | null;

  // Relaciones
  user: UserApp;
  role: Role;
}