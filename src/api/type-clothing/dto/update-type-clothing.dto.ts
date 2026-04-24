import { PartialType } from '@nestjs/mapped-types';
import { CreateTypeClothingDto } from './create-type-clothing.dto';

export class UpdateTypeClothingDto extends PartialType(CreateTypeClothingDto) {}
