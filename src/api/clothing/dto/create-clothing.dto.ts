import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateClothingDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 2, { message: 'El id debe tener exactamente 2 caracteres' })
  id: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  name: string;
}
