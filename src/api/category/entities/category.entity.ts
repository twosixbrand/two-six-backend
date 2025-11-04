import { Category as CategoryModel } from '@prisma/client';

export class CategoryEntity implements CategoryModel {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date | null;
}