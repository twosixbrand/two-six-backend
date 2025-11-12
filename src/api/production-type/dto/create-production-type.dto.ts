import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProductionTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
