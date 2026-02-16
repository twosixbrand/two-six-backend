import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateClothingColorDto {
  @IsNumber()
  @IsNotEmpty()
  id_color: number;

  @IsNumber()
  @IsNotEmpty()
  id_design: number;
}