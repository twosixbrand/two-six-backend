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
  id_clothing_size: number; // Propiedad clave para la relación

  // Opcional: si quieres controlar estos desde el cliente
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsBoolean()
  @IsOptional()
  is_outlet?: boolean;
}
