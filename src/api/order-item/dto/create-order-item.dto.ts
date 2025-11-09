import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsInt()
  @IsNotEmpty()
  id_order: number;

  @IsInt()
  @IsNotEmpty()
  id_product: number;

  @IsString()
  @IsNotEmpty()
  product_name: string;

  @IsString()
  @IsNotEmpty()
  size: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsNumber()
  @Min(0)
  iva_item: number;
}
