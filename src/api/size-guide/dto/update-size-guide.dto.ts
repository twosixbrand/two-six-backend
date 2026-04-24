import { PartialType } from '@nestjs/mapped-types';
import { CreateSizeGuideDto } from './create-size-guide.dto';

export class UpdateSizeGuideDto extends PartialType(CreateSizeGuideDto) {}
