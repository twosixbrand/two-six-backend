import { DesignClothing as DesignClothingModel } from '@prisma/client';

export class DesignClothingEntity implements DesignClothingModel {
  id: number;
  id_color: number;
  id_size: number;
  id_design: number;
  quantity_produced: number;
  quantity_available: number;
  quantity_sold: number;
  quantity_on_consignment: number;
  createdAt: Date;
  updatedAt: Date | null;
}