import { IsString, IsOptional } from 'class-validator';

export class CreateErrorLogDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  stack?: string;
}
