import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdatePucAccountDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  level?: number;

  @IsString()
  @IsOptional()
  nature?: string;

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
