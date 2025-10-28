import { UserApp, UserRole } from '@prisma/client';

export class UserAppEntity implements UserApp {
  code_user: number;
  login: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  userRoles: UserRole[];
}
