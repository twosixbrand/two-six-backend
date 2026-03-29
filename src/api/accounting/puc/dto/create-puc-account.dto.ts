import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreatePucAccountDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  @Max(5)
  level: number;

  @IsString()
  @IsNotEmpty()
  nature: string; // DEBITO or CREDITO

  @IsString()
  @IsOptional()
  parent_code?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsBoolean()
  @IsOptional()
  accepts_movements?: boolean;
}
