import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateExpenseDto {
  @IsNumber()
  @IsNotEmpty()
  id_expense_category: number;

  @IsNumber()
  @IsNotEmpty()
  id_puc_account: number;

  @IsString()
  @IsOptional()
  id_provider?: string;

  @IsString()
  @IsOptional()
  invoice_number?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  subtotal: number;

  @IsNumber()
  @IsOptional()
  tax_amount?: number;

  @IsNumber()
  @IsOptional()
  retention_amount?: number;

  @IsNumber()
  @IsNotEmpty()
  total: number;

  @IsDateString()
  @IsNotEmpty()
  expense_date: string;

  @IsDateString()
  @IsOptional()
  due_date?: string;

  @IsString()
  @IsOptional()
  attachment_url?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
