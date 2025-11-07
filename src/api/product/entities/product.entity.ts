import {
  Category,
  Clothing,
  Color,
  Design,
  Product as ProductModel,
  Size,
  TypeClothing,
} from '@prisma/client';

// Entidad para la variante de diseño, que incluye sus relaciones
class DesignClothingEntity {
  id: number;
  quantity_available: number;
  color: Color;
  size: Size;
  design: Design & {
    clothing: Clothing & {
      typeClothing: TypeClothing;
      category: Category;
    };
  };
}

export class Product implements ProductModel {
  id: number;
  id_design_clothing: number;
  name: string;
  description: string;
  sku: string | null;
  price: number;
  consecutive_number: string | null;
  image_url: string | null;
  active: boolean;
  is_outlet: boolean;
  createdAt: Date;
  updatedAt: Date | null;

  // Relaciones anidadas que se incluyen en las consultas
  designClothing: DesignClothingEntity;
}
