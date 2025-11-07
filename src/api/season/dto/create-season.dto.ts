import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSeasonDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}