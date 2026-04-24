import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePqrDto {
  @IsString()
  @IsNotEmpty()
  customer_name: string;

  @IsString()
  @IsNotEmpty()
  customer_id: string;

  @IsEmail()
  @IsNotEmpty()
  customer_email: string;

  @IsString()
  @IsOptional()
  order_number?: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
