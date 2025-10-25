import { PartialType } from '@nestjs/mapped-types';
import { CreateErrorLogDto } from './create-error-log.dto';

export class UpdateErrorLogDto extends PartialType(CreateErrorLogDto) {}