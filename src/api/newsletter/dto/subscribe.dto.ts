import { IsEmail, IsNotEmpty } from 'class-validator';

export class SubscribeDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  email: string;
}
