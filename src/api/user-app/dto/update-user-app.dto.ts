import { PartialType } from '@nestjs/mapped-types';
import { CreateUserAppDto } from './create-user-app.dto';

export class UpdateUserAppDto extends PartialType(CreateUserAppDto) {}
