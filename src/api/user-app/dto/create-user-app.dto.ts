import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

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
}
