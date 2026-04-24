import {
  IsString,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  percentage: number;

  @IsBoolean()
  free_shipping: boolean;

  @IsDateString()
  valid_from: string;

  @IsDateString()
  valid_until: string;

  @IsOptional()
  @IsBoolean()
  is_single_use_per_client?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_uses?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  min_purchase_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  min_items_count?: number;
}
