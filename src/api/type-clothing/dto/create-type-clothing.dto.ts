import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateTypeClothingDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;
}