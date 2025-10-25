import { IsString, IsOptional, Length } from 'class-validator';

export class CreateErrorLogDto {
  @IsString()
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
