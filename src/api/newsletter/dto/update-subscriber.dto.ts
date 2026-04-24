import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSubscriberDto {
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsBoolean()
  unsubscribed?: boolean;
}
