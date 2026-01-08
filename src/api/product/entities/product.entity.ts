import {
  Category,
  Clothing,
  Color,
  Product as ProductModel,
  Size,
  TypeClothing,
  ClothingColor as ClothingColorModel,
} from '@prisma/client';

interface DesignWithRelations {
  description: string | null;
  clothing: Pick<Clothing, 'name' | 'gender'> & {
    typeClothing: TypeClothing;
    category: Category;
  };
}

// Entidad para Clothing Color (Design + Color)
class ClothingColorEntity implements ClothingColorModel {
  id: number;
  id_design: number;
  id_color: number;
  image_url: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  design: DesignWithRelations;
  color: Color;
}

// Entidad para la variante de talla
class ClothingSizeEntity {
  id: number;
  id_clothing_color: number;
  id_size: number;
  quantity_produced: number;
  quantity_available: number;
  quantity_sold: number;
  quantity_on_consignment: number;
  quantity_under_warranty: number;
  created_at: Date;
  updated_at: Date | null;
  size: Size;
  clothingColor: ClothingColorEntity;
}

export class Product implements ProductModel {
  id: number;
  id_clothing_size: number;
  sku: string | null;
  price: number;
  discount_price: number | null;
  discount_percentage: number | null;
  active: boolean;
  is_outlet: boolean;
  createdAt: Date;
  updatedAt: Date | null;

  // Relaciones anidadas que se incluyen en las consultas
  clothingSize: ClothingSizeEntity;
}
