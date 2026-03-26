import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegisterCustomerDto {
    @IsString()
    @IsNotEmpty()
    document_number: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsNotEmpty()
    department: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsNotEmpty()
    address: string;
}
