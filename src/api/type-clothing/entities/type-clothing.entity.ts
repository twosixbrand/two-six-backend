import { TypeClothing as TypeClothingModel } from '@prisma/client';

export class TypeClothingEntity implements TypeClothingModel {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date | null;
}