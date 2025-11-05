import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class CreateClothingDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @IsString()
  @IsNotEmpty()
  @Length(1, 2)
  id_type_clothing: string;

  @IsNumber()
  @IsNotEmpty()
  id_category: number;
}
