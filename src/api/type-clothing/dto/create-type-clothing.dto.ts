import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateTypeClothingDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 1)
  code: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 30)
  name: string;
}
