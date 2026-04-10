import { Controller, Get, Post, Body, Patch, Param, Delete , UseGuards } from '@nestjs/common';
import { ClothingSizeService } from './clothing-size.service';
import { CreateClothingSizeDto } from './dto/create-clothing-size.dto';
import { UpdateClothingSizeDto } from './dto/update-clothing-size.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';


@UseGuards(JwtAuthGuard)
@Controller('clothing-size')
export class ClothingSizeController {
    constructor(private readonly clothingSizeService: ClothingSizeService) { }

    @Post()
    create(@Body() createClothingSizeDto: CreateClothingSizeDto) {
        return this.clothingSizeService.create(createClothingSizeDto);
    }

    @Get()
    findAll() {
        return this.clothingSizeService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.clothingSizeService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateClothingSizeDto: UpdateClothingSizeDto) {
        return this.clothingSizeService.update(+id, updateClothingSizeDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.clothingSizeService.remove(+id);
    }
}
