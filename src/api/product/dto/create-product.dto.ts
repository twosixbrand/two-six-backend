// src/api/product/dto/create-product.dto.ts
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateProductDto {
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsOptional()
  discount_price: number;

  @IsNumber()
  @IsOptional()
  discount_percentage: number;

  @IsNumber()
  @IsNotEmpty()
  id_design_clothing: number; // Propiedad clave para la relación

  @IsString()
  @IsOptional()
  image_url?: string;

  // Opcional: si quieres controlar estos desde el cliente
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsBoolean()
  @IsOptional()
  is_outlet?: boolean;
}
