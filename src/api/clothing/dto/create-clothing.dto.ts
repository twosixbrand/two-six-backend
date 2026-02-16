import {
  IsArray,
  IsNotEmpty,
  IsString,
  IsInt,
} from 'class-validator';
// import { Gender } from '@prisma/client';

export class CreateClothingDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  id_type_clothing: string;

  @IsInt()
  @IsNotEmpty()
  id_category: number;

  @IsInt()
  @IsNotEmpty()
  id_gender: number;
}
