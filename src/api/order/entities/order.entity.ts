import { Order as OrderModel } from '@prisma/client';

export class OrderEntity implements OrderModel {
  id: number;
  order_reference: string | null;
  id_customer: number;
  order_date: Date;
  status: string;
  iva: number;
  shipping_cost: number;
  total_payment: number;
  purchase_date: Date;
  is_paid: boolean;
  payment_method: string;
  cod_amount: number;
  transaction_id: string | null;
  shipping_address: string;
  createdAt: Date;
  updatedAt: Date | null;
  delivery_method: string;
  pickup_status: string | null;
  pickup_pin: string | null;
}