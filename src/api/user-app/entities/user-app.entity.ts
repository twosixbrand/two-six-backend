import { UserApp as UserAppModel } from '@prisma/client';

export class UserAppEntity implements UserAppModel {
  id: number;
  name: string;
  login: string;
  email: string;
  phone: string;
  password: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  otp: string | null;
  otpExpiresAt: Date | null;
}