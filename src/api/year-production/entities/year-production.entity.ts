import { YearProduction as YearProductionModel } from '@prisma/client';

export class YearProductionEntity implements YearProductionModel {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}