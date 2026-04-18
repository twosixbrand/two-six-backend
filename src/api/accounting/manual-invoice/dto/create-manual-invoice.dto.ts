import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ManualInvoiceLineDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  unit_price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  iva_rate?: number; // porcentaje, default 19
}

export class ManualInvoiceCustomerDto {
  @IsString()
  @IsNotEmpty()
  doc_type: string; // DIAN code ej: '13' (CC), '31' (NIT)

  @IsString()
  @IsNotEmpty()
  doc_number: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;
}

export class CreateManualInvoiceDto {
  @IsInt()
  @IsPositive()
  cash_receipt_journal_id: number;

  @IsString()
  @IsNotEmpty()
  advance_puc_code: string; // ej '280505'

  @IsString()
  @IsNotEmpty()
  revenue_puc_code: string; // ej '413524'

  @IsString()
  @IsNotEmpty()
  iva_puc_code: string; // ej '240801'

  @IsDateString()
  @IsNotEmpty()
  operation_date: string; // fecha real de la venta (retroactiva, va al asiento)

  @ValidateNested()
  @Type(() => ManualInvoiceCustomerDto)
  customer: ManualInvoiceCustomerDto;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ManualInvoiceLineDto)
  items: ManualInvoiceLineDto[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  created_by?: number;
}
