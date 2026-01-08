import { PartialType } from '@nestjs/mapped-types';
import { CreateClothingColorDto } from './create-clothing-color.dto';

export class UpdateClothingColorDto extends PartialType(CreateClothingColorDto) { }