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
  quantity_under_warranty: number;
  createdAt: Date;
  updatedAt: Date | null;
}