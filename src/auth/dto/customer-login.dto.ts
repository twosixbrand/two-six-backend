import { IsEmail, IsNotEmpty } from 'class-validator';

export class CustomerLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
