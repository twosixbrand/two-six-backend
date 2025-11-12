import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMasterDesignDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id_collection: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id_provider: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id_clothing: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reference: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  manufactured_cost: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  quantity: number;
}
