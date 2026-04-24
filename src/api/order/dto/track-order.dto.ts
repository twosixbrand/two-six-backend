import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class TrackOrderDto {
  @IsNotEmpty()
  @IsString()
  orderReference: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}
