import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
} from 'class-validator';

export class CreateMasterDesignDto {
  @IsString()
  @IsNotEmpty()
  id_provider: string;

  @IsNumber()
  @IsNotEmpty()
  id_clothing: number;

  @IsNumber()
  @IsNotEmpty()
  id_collection: number;

  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsNumber()
  @IsPositive()
  manufactured_cost: number;

  @IsInt()
  @Min(0)
  quantity: number;
}