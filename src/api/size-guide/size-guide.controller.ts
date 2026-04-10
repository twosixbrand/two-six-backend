import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe , UseGuards } from '@nestjs/common';
import { SizeGuideService } from './size-guide.service';
import { CreateSizeGuideDto } from './dto/create-size-guide.dto';
import { UpdateSizeGuideDto } from './dto/update-size-guide.dto';

@Controller('size-guide')
export class SizeGuideController {
    constructor(private readonly sizeGuideService: SizeGuideService) { }
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateSizeGuideDto) {
        return this.sizeGuideService.update(id, updateDto);
    }
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.sizeGuideService.remove(id);
    }
}

