import { PartialType } from '@nestjs/mapped-types';
import { CreateReturnItemDto } from './create-return-item.dto';

export class UpdateReturnItemDto extends PartialType(CreateReturnItemDto) {}
