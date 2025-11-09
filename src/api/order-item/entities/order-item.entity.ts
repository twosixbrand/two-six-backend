export class OrderItem {
  id: number;
  id_order: number;
  id_product: number;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  iva_item: number;
  createdAt: Date;
  updatedAt: Date | null;
}
