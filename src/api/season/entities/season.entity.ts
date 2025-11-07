import { Season as SeasonModel } from '@prisma/client';

export class SeasonEntity implements SeasonModel {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}