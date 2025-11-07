import { PartialType } from '@nestjs/mapped-types';
import { CreateMasterDesignDto } from './create-master-design.dto';

export class UpdateMasterDesignDto extends PartialType(CreateMasterDesignDto) {}