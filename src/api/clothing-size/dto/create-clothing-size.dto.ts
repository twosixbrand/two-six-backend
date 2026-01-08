import { IsInt, IsOptional, Min } from 'class-validator';

export class CreateClothingSizeDto {
    @IsInt()
    id_clothing_color: number;

    @IsInt()
    id_size: number;

    @IsInt()
    @Min(0)
    quantity_produced: number;

    @IsInt()
    @Min(0)
    quantity_available: number;
    @IsOptional()
    @IsInt()
    quantity_minimum_alert?: number;
    @IsInt()
    @Min(0)
    @IsOptional()
    quantity_sold?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    quantity_on_consignment?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    quantity_under_warranty?: number;
}
