import { PartialType } from '@nestjs/mapped-types';
import { CreateClothingDto } from './create-clothing.dto';

export class UpdateClothingDto extends PartialType(CreateClothingDto) {}
