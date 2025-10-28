import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserAppDto {
  @IsString()
  @IsNotEmpty()
  login: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
