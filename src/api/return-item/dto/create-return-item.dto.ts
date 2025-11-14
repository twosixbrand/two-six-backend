import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateReturnItemDto {
  @IsInt()
  id_return: number;

  @IsInt()
  id_order_item: number;

  @IsInt()
  id_product: number;

  @IsInt()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  reason_return: string;

  @IsString()
  @IsNotEmpty()
  condition: string;
}
