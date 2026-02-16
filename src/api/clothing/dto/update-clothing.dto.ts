import { PartialType } from '@nestjs/swagger';
import { CreateClothingDto } from './create-clothing.dto';
import { IsArray, IsInt, IsOptional } from 'class-validator';

export class UpdateClothingDto extends PartialType(CreateClothingDto) {
    @IsInt()
    @IsOptional()
    id_gender?: number;
}
