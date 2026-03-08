import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { SizeGuideService } from './size-guide.service';
import { CreateSizeGuideDto } from './dto/create-size-guide.dto';
import { UpdateSizeGuideDto } from './dto/update-size-guide.dto';

@Controller('size-guide')
export class SizeGuideController {
    constructor(private readonly sizeGuideService: SizeGuideService) { }

    @Post()
    create(@Body() createDto: CreateSizeGuideDto) {
        return this.sizeGuideService.create(createDto);
    }

    @Get()
    findAll() {
        return this.sizeGuideService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.sizeGuideService.findOne(id);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateSizeGuideDto) {
        return this.sizeGuideService.update(id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.sizeGuideService.remove(id);
    }
}

