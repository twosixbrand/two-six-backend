import { IsEmail, IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class RegisterCustomerDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    document_number: string;

    @IsInt()
    @IsNotEmpty()
    id_identification_type: number; // 1=CC, 2=CE, 3=NIT, etc.

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsOptional()
    department?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    address?: string;
}
