import { ErrorLog as ErrorLogModel } from '@prisma/client';

export class ErrorLogEntity implements ErrorLogModel {
  id: number;
  message: string;
  stack: string | null;
  componentStack: string | null;
  app: string | null;
  page: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}