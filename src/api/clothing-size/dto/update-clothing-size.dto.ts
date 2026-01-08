import { PartialType } from '@nestjs/mapped-types';
import { CreateClothingSizeDto } from './create-clothing-size.dto';

export class UpdateClothingSizeDto extends PartialType(CreateClothingSizeDto) { }
