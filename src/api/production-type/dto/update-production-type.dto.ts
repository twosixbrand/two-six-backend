import { PartialType } from '@nestjs/swagger';
import { CreateProductionTypeDto } from './create-production-type.dto';

export class UpdateProductionTypeDto extends PartialType(CreateProductionTypeDto) {}
