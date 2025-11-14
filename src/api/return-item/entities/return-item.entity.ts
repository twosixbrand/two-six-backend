export class ReturnItem {
  id: number;
  id_return: number;
  id_order_item: number;
  id_product: number;
  quantity: number;
  reason_return: string;
  condition: string;
  createdAt: Date;
  updatedAt: Date | null;
}
