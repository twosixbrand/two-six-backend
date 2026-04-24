import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UploadStatementDto {
  @IsNumber()
  @IsNotEmpty()
  bankAccountId: number;

  @IsDateString()
  @IsNotEmpty()
  periodStart: string;

  @IsDateString()
  @IsNotEmpty()
  periodEnd: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  csvContent: string;
}
