import { Design } from '@prisma/client';

export class MasterDesign implements Design {
  id: number;
  id_clothing: number;
  id_collection: number;
  reference: string;
  manufactured_cost: number;
  description: string | null;
  image_url: string | null;

  createdAt: Date;
  updatedAt: Date | null;
}
