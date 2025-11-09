import {
  IsBoolean,
  IsDateString,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @IsNotEmpty()
  id_customer: number;

  @IsISO8601()
  @IsNotEmpty()
  order_date: Date;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsNumber()
  @IsPositive()
  iva: number;

  @IsNumber()
  @IsPositive()
  shipping_cost: number;

  @IsNumber()
  @IsPositive()
  total_payment: number;

  @IsISO8601()
  @IsNotEmpty()
  purchase_date: Date;

  @IsBoolean()
  @IsNotEmpty()
  is_paid: boolean;

  @IsString()
  @IsNotEmpty()
  shipping_address: string;
}
