import { PartialType } from '@nestjs/swagger';
import { CreateDesignProviderDto } from './create-design-provider.dto';

export class UpdateDesignProviderDto extends PartialType(CreateDesignProviderDto) {}
