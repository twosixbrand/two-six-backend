import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { YearProductionService } from './year-production.service';
import { CreateYearProductionDto } from './dto/create-year-production.dto';
import { UpdateYearProductionDto } from './dto/update-year-production.dto';

@Controller('year-production')
export class YearProductionController {
  constructor(private readonly yearProductionService: YearProductionService) {}
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createYearProductionDto: CreateYearProductionDto) {
    return this.yearProductionService.create(createYearProductionDto);
  }

  @Get()
  findAll() {
    return this.yearProductionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.yearProductionService.findOne(id);
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateYearProductionDto: UpdateYearProductionDto,
  ) {
    return this.yearProductionService.update(id, updateYearProductionDto);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.yearProductionService.remove(id);
  }
}
