import { UserApp as UserAppModel, Role } from '@prisma/client';

class UserRoleEntity {
  role: Role;
}

export class UserAppEntity implements UserAppModel {
  id: number;
  name: string;
  login: string;
  email: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date | null;
  userRoles: UserRoleEntity[];
}