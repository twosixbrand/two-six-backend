import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyCustomerOtpDto {
  @IsString()
  @IsNotEmpty()
  document_number: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}
