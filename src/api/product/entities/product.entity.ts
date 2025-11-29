import {
  Category,
  Clothing,
  Color,
  Product as ProductModel,
  Size,
  TypeClothing,
} from '@prisma/client';

interface DesignWithRelations {
  description: string | null;
  clothing: Pick<Clothing, 'name' | 'gender'> & {
    typeClothing: TypeClothing;
    category: Category;
  };
}

// Entidad para la variante de diseño, que incluye sus relaciones
class DesignClothingEntity {
  id: number;
  quantity_available: number;
  color: Color;
  size: Size;
  design: DesignWithRelations;
}

export class Product implements ProductModel {
  id: number;
  id_design_clothing: number;
  sku: string | null;
  price: number;
  discount_price: number | null;
  discount_percentage: number | null;
  image_url: string | null;
  active: boolean;
  is_outlet: boolean;
  createdAt: Date;
  updatedAt: Date | null;

  // Relaciones anidadas que se incluyen en las consultas
  designClothing: DesignClothingEntity;
}
