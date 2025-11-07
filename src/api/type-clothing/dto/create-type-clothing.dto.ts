import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateTypeClothingDto {
  @Length(1, 2)
  id: string;
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;
}
