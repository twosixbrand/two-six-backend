import { PartialType } from '@nestjs/mapped-types';
import { CreateDesignClothingDto } from './create-design-clothing.dto';

export class UpdateDesignClothingDto extends PartialType(CreateDesignClothingDto) {}