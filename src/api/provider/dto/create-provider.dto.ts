import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';

export class CreateProviderDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  id: string; // Corresponde al NIT

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  company_name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  account_number: string;

  @IsString()
  @IsNotEmpty()
  account_type: string;

  @IsString()
  @IsNotEmpty()
  bank_name: string;
}

