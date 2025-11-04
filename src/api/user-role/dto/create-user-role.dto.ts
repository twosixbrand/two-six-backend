import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateUserRoleDto {
  @IsInt()
  @IsNotEmpty()
  id_user_app: number;

  @IsInt()
  @IsNotEmpty()
  id_role: number;
}