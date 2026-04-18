import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateCashReceiptDto {
  @IsDateString()
  @IsNotEmpty()
  consignment_date: string;

  @IsString()
  @IsNotEmpty()
  bank_puc_code: string;

  @IsString()
  @IsNotEmpty()
  advance_puc_code: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  customer_nit?: string;

  @IsString()
  @IsOptional()
  customer_name?: string;

  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  created_by?: number;
}
