import { IsString, IsOptional, Length, IsNotEmpty } from 'class-validator';

export class CreateErrorLogDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  stack?: string;

  @IsOptional()
  @IsString()
  componentStack?: string;

  @IsOptional()
  @IsString()
  @Length(1, 4)
  app?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  page?: string;
}
