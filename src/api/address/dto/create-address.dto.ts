import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateAddressDto {
    @IsInt()
    id_customer: number;

    @IsString()
    address: string;

    @IsOptional()
    @IsString()
    detail?: string;

    @IsOptional()
    @IsString()
    instructions?: string;

    @IsString()
    city: string;

    @IsString()
    state: string;

    @IsString()
    postal_code: string;

    @IsString()
    country: string;

    @IsOptional()
    @IsBoolean()
    is_default?: boolean;
}
