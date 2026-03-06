import { Controller, Get, Post, Body, Param, Put, Delete, UsePipes, ValidationPipe, ParseIntPipe, UseInterceptors, UploadedFiles, Patch, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PqrService } from './pqr.service';
import { CreatePqrDto } from './dto/create-pqr.dto';
import { UpdatePqrStatusDto } from './dto/update-pqr-status.dto';

@Controller('pqr')
export class PqrController {
    constructor(private readonly pqrService: PqrService) { }

    @Post()
    @UseInterceptors(FilesInterceptor('images'))
    create(
        @Body() createPqrDto: CreatePqrDto,
        @UploadedFiles() images: Express.Multer.File[]
    ) {
        return this.pqrService.create(createPqrDto, images);
    }

    @Get()
    findAll() {
        return this.pqrService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.pqrService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body('status') status: string,
        @Body('observation') observation?: string,
    ) {
        if (!status) {
            throw new BadRequestException('Status is required');
        }
        return this.pqrService.updateStatus(+id, status, observation);
    }
}
