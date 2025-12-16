import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateCustomerDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    current_phone_number?: string;

    @IsOptional()
    @IsString()
    shipping_address?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    postal_code?: string;

    @IsOptional()
    @IsString()
    country?: string;
}
