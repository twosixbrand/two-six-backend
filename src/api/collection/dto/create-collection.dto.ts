import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  id_season: number;

  @IsString()
  @IsNotEmpty()
  @Length(2)
  id_year_production: string;

  @IsString()
  @IsOptional()
  description?: string;
}