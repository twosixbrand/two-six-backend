import { ClothingColor as ClothingColorModel } from '@prisma/client';

export class ClothingColorEntity implements ClothingColorModel {
  clothing_name?: string; // Campo añadido para el nombre de la prenda
  color_name?: string; // Campo añadido para el nombre del color
  size_name?: string; // Campo añadido para el nombre de la talla

  id: number;
  id_color: number;
  id_size: number;
  id_design: number;
  quantity_produced: number;
  quantity_available: number;
  quantity_sold: number;
  quantity_on_consignment: number;
  quantity_under_warranty: number;
  image_url: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}
