import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { Gender } from '@prisma/client';

export class QueryProductDto {
  @IsString()
  @IsOptional()
  gender?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    // Devuelve el valor como está si no es 'true' o 'false' para que IsBoolean lo valide o falle.
    // Si el parámetro no está en la URL, `value` será `undefined` y se mantendrá así.
    return value;
  })
  is_outlet?: boolean;
}
