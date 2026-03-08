import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSizeGuideDto {
    @IsString()
    @IsNotEmpty()
    size: string;

    @IsString()
    @IsNotEmpty()
    width: string;

    @IsString()
    @IsNotEmpty()
    length: string;
}
