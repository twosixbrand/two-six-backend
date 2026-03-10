import { Controller, Get, Param, ParseIntPipe, Patch, Body, Query } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('locations')
export class LocationController {
    constructor(private readonly locationService: LocationService) { }

    @Get('departments')
    getDepartments() {
        return this.locationService.getDepartments();
    }

    @Get('cities/:departmentId')
    getCities(
        @Param('departmentId', ParseIntPipe) departmentId: number,
        @Query('active') active?: string,
    ) {
        const isActive = active === 'true';
        return this.locationService.getCities(departmentId, isActive);
    }

    @Patch('departments/:id')
    updateDepartment(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: { name?: string },
    ) {
        return this.locationService.updateDepartment(id, data);
    }

    @Patch('cities/:id')
    async updateCity(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: { active?: boolean; shipping_cost?: number },
    ) {
        try {
            return await this.locationService.updateCity(id, data);
        } catch (error) {
            console.error(`Error updating city ${id}:`, error);
            throw error;
        }
    }

    @Patch('departments/:id/bulk-cost')
    async bulkUpdateCitiesCost(
        @Param('id', ParseIntPipe) departmentId: number,
        @Body() data: { shipping_cost: number },
    ) {
        return this.locationService.bulkUpdateCitiesCost(departmentId, data.shipping_cost);
    }
}
