import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateExpenseDto {
  @IsNumber()
  @IsOptional()
  id_expense_category?: number;

  @IsNumber()
  @IsOptional()
  id_puc_account?: number;

  @IsString()
  @IsOptional()
  id_provider?: string;

  @IsString()
  @IsOptional()
  invoice_number?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @IsOptional()
  tax_amount?: number;

  @IsNumber()
  @IsOptional()
  retention_amount?: number;

  @IsNumber()
  @IsOptional()
  total?: number;

  @IsDateString()
  @IsOptional()
  expense_date?: string;

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
