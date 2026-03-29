import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class JournalEntryLineDto {
  @IsNumber()
  @IsNotEmpty()
  id_puc_account: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  debit: number;

  @IsNumber()
  credit: number;
}

export class CreateJournalEntryDto {
  @IsDateString()
  @IsNotEmpty()
  entry_date: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  source_type: string;

  @IsNumber()
  @IsOptional()
  source_id?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  created_by?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines: JournalEntryLineDto[];
}
