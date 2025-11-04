import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  description?: string;
}