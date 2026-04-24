import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TaxType {
  ICA = 'ICA',
  AUTORETENCION_RENTA = 'AUTORETENCION_RENTA',
}

export class CreateTaxConfigDto {
  @ApiProperty({
    example: 'ICA Bogotá',
    description: 'Nombre descriptivo de la tarifa',
  })
  @IsString()
  name: string;

  @ApiProperty({ enum: TaxType, example: 'ICA' })
  @IsEnum(TaxType)
  type: string;

  @ApiProperty({ example: 1, description: 'ID de la ciudad (para ICA)' })
  @IsNumber()
  @IsOptional()
  city_id?: number;

  @ApiProperty({
    example: 0.01104,
    description: 'Tarifa (ej. 11.04 x 1000 = 0.01104)',
  })
  @IsNumber()
  rate: number;

  @ApiProperty({ example: 10, description: 'ID cuenta PUC débito' })
  @IsNumber()
  @IsOptional()
  puc_account_debit?: number;

  @ApiProperty({ example: 11, description: 'ID cuenta PUC crédito' })
  @IsNumber()
  @IsOptional()
  puc_account_credit?: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
