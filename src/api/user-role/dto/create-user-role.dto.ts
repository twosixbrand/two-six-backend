import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateUserRoleDto {
  @IsInt()
  @IsNotEmpty()
  code_user: number;

  @IsInt()
  @IsNotEmpty()
  code_role: number;
}