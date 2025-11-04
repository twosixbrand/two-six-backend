import {
  Category,
  Clothing as ClothingModel,
  Gender,
  TypeClothing,
} from '@prisma/client';

export class ClothingEntity implements ClothingModel {
  id: number;
  id_type_clothing: number;
  id_category: number;
  name: string;
  gender: Gender;
  createdAt: Date;
  updatedAt: Date | null;
  typeClothing: TypeClothing;
  category: Category;
}