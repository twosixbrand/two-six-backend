import { Gender } from '@prisma/client';

export class Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  gender: Gender;
  isOutlet: boolean;
  createdAt: Date;
  updatedAt: Date;
}
