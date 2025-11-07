import { Color as ColorModel } from '@prisma/client';

export class ColorEntity implements ColorModel {
  id: number;
  name: string;
  hex: string;
  createdAt: Date;
  updatedAt: Date | null;
}