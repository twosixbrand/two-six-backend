import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PucService } from './puc.service';
import { CreatePucAccountDto } from './dto/create-puc-account.dto';
import { UpdatePucAccountDto } from './dto/update-puc-account.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounting/puc')
export class PucController {
  constructor(private readonly pucService: PucService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.pucService.findAll(search);
  }

  @Get('tree')
  getTree() {
    return this.pucService.getTree();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pucService.findOne(id);
  }

  @Post()
  create(@Body() createPucAccountDto: CreatePucAccountDto) {
    return this.pucService.create(createPucAccountDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePucAccountDto: UpdatePucAccountDto,
  ) {
    return this.pucService.update(id, updatePucAccountDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pucService.remove(id);
  }
}
