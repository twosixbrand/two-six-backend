import { IsEmail, IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';

export class CreateUserAppDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  login: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  @Length(6, 6, { message: 'El OTP debe tener exactamente 6 caracteres.' })
  otp:string;

}
