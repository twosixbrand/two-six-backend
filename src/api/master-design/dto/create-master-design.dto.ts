import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMasterDesignDto {
  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  id_collection: number;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  id_clothing: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  manufactured_cost: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
