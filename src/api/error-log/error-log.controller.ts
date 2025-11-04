import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ErrorLogService } from './error-log.service';
import { CreateErrorLogDto } from './dto/create-error-log.dto';
import { UpdateErrorLogDto } from './dto/update-error-log.dto';

@Controller('error-log')
export class ErrorLogController {
  constructor(private readonly errorLogService: ErrorLogService) {}

  @Post()
  create(@Body() createErrorLogDto: CreateErrorLogDto) {
    return this.errorLogService.create(createErrorLogDto);
  }

  @Get()
  findAll() {
    return this.errorLogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.errorLogService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateErrorLogDto: UpdateErrorLogDto,
  ) {
    return this.errorLogService.update(id, updateErrorLogDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.errorLogService.remove(id);
  }
}