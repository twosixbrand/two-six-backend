// src/products/dto/create-product.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsUrl,
  IsEnum,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Gender } from '@prisma/client';

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

  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;
}
