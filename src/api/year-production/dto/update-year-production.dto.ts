import { PartialType } from '@nestjs/mapped-types';
import { CreateYearProductionDto } from './create-year-production.dto';

export class UpdateYearProductionDto extends PartialType(CreateYearProductionDto) {}