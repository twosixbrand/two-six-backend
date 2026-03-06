import { Controller, Get, Post, Body, Param, Put, ParseIntPipe } from '@nestjs/common';
import { PqrService } from './pqr.service';
import { CreatePqrDto } from './dto/create-pqr.dto';
import { UpdatePqrStatusDto } from './dto/update-pqr-status.dto';

@Controller('pqr')
export class PqrController {
    constructor(private readonly pqrService: PqrService) { }

    @Post()
    create(@Body() createPqrDto: CreatePqrDto) {
        return this.pqrService.create(createPqrDto);
    }

    @Get()
    findAll() {
        return this.pqrService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.pqrService.findOne(id);
    }

    @Put(':id/status')
    updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() updatePqrStatusDto: UpdatePqrStatusDto
    ) {
        return this.pqrService.updateStatus(id, updatePqrStatusDto.status);
    }
}
