import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBankAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  bank_name: string;

  @IsString()
  @IsNotEmpty()
  account_number: string;

  @IsString()
  @IsNotEmpty()
  account_type: string; // AHORROS, CORRIENTE

  @IsNumber()
  @IsNotEmpty()
  id_puc_account: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
