import { Order as OrderModel } from '@prisma/client';

export class OrderEntity implements OrderModel {
  id: number;
  id_customer: number;
  order_date: Date;
  status: string;
  iva: number;
  shipping_cost: number;
  total_payment: number;
  purchase_date: Date;
  is_paid: boolean;
  shipping_address: string;
  createdAt: Date;
  updatedAt: Date | null;
}