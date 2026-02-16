import { IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetGeneralSalesReportDto {
    @ApiPropertyOptional({ description: 'Fecha de inicio del reporte (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ description: 'Fecha de fin del reporte (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    endDate?: string;
}
