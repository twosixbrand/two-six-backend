import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class TrackOrderDto {
    @IsNotEmpty()
    @IsNumber()
    orderId: number;

    @IsNotEmpty()
    @IsEmail()
    email: string;
}
