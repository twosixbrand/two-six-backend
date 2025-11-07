import { Collection as CollectionModel } from '@prisma/client';

export class CollectionEntity implements CollectionModel {
  id: number;
  name: string;
  id_season: number;
  id_year_production: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}