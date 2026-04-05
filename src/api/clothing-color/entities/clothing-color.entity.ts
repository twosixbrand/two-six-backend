import { ClothingColor as ClothingColorModel } from '@prisma/client';

export class ClothingColorEntity implements ClothingColorModel {
  clothing_name?: string;
  color_name?: string;
  size_name?: string;

  id: number;
  id_color: number;
  id_size: number;
  id_design: number;
  id_gender: number;
  slug: string | null;
  seo_title: string | null;
  seo_desc: string | null;
  seo_h1: string | null;
  seo_alt: string | null;
  quantity_produced: number;
  quantity_available: number;
  quantity_sold: number;
  quantity_on_consignment: number;
  quantity_under_warranty: number;
  createdAt: Date;
  updatedAt: Date | null;
}
