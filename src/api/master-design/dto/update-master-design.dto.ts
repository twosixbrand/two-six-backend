import { PartialType } from '@nestjs/swagger';
import { CreateMasterDesignDto } from './create-master-design.dto';

export class UpdateMasterDesignDto extends PartialType(CreateMasterDesignDto) {}
