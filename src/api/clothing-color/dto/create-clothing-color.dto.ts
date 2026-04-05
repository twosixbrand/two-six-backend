import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateClothingColorDto {
  @IsNumber()
  @IsNotEmpty()
  id_color: number;

  @IsNumber()
  @IsNotEmpty()
  id_design: number;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  seo_title?: string;

  @IsOptional()
  @IsString()
  seo_desc?: string;

  @IsOptional()
  @IsString()
  seo_h1?: string;

  @IsOptional()
  @IsString()
  seo_alt?: string;
}