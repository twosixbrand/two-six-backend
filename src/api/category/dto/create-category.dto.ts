import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 2, { message: 'El id debe tener entre 1 y 2 caracteres' })
  code_cat: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  description?: string;
}
