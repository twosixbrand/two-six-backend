import { Type } from 'class-transformer';
import {
    IsArray,
    IsEmail,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

class CustomerDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsNotEmpty()
    department: string; // State/Department
}

class OrderItemDto {
    @IsNumber()
    @IsNotEmpty()
    productId: number;

    @IsNumber()
    @IsNotEmpty()
    quantity: number;

    @IsNumber()
    @IsNotEmpty()
    price: number;

    @IsString()
    @IsNotEmpty()
    productName: string;

    @IsString()
    @IsNotEmpty()
    size: string;

    @IsString()
    @IsNotEmpty()
    color: string;

    @IsString()
    @IsOptional()
    image: string;
}

export class CheckoutDto {
    @ValidateNested()
    @Type(() => CustomerDto)
    @IsNotEmpty()
    customer: CustomerDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    @IsNotEmpty()
    items: OrderItemDto[];

    @IsNumber()
    @IsNotEmpty()
    total: number;

    @IsNumber()
    @IsNotEmpty()
    shippingCost: number;
}
