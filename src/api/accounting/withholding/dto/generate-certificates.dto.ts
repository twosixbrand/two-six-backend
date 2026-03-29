import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class GenerateCertificatesDto {
  @IsInt()
  @IsNotEmpty()
  @Min(2020)
  year: number;
}
