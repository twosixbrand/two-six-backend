import { Design } from '@prisma/client';

export class MasterDesign implements Design {
  id: number;
  id_provider: string;
  id_clothing: number;
  id_collection: number;
  reference: string;
  manufactured_cost: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date | null;
}
