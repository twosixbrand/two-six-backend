import { Size as SizeModel } from '@prisma/client';

export class SizeEntity implements SizeModel {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}