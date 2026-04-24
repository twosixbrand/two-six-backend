import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdatePqrStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['Abierto', 'En Revisión', 'Resuelto', 'Cerrado'])
  status: string;
}
