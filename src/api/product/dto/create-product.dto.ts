// src/api/product/dto/create-product.dto.ts
import { IsString, IsNumber, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

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
  outlet?: boolean;
}
