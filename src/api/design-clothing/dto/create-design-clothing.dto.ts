import { IsNotEmpty, IsNumber, IsInt, Min } from 'class-validator';

export class CreateDesignClothingDto {
  @IsNumber()
  @IsNotEmpty()
  id_color: number;

  @IsNumber()
  @IsNotEmpty()
  id_size: number;

  @IsNumber()
  @IsNotEmpty()
  id_design: number;

  @IsInt()
  @Min(0)
  quantity_produced: number;

  @IsInt()
  @Min(0)
  quantity_available: number;

  @IsInt()
  @Min(0)
  quantity_sold: number;

  @IsInt()
  @Min(0)
  quantity_on_consignment: number;
}