import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateYearProductionDto {
  @IsString()
  @IsNotEmpty()
  @Length(2)
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsOptional()
  description?: string;
}
