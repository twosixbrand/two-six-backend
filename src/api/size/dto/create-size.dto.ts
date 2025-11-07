import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSizeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}