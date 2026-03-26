import { IsNotEmpty, IsString } from 'class-validator';

export class CustomerLoginDto {
  @IsString()
  @IsNotEmpty()
  document_number: string;
}
