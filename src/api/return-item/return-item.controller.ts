import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ReturnItemService } from './return-item.service';
import { CreateReturnItemDto } from './dto/create-return-item.dto';
import { UpdateReturnItemDto } from './dto/update-return-item.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('return-items')
export class ReturnItemController {
  constructor(private readonly returnItemService: ReturnItemService) {}

  @Post()
  create(@Body() createReturnItemDto: CreateReturnItemDto) {
    return this.returnItemService.create(createReturnItemDto);
  }

  @Get()
  findAll() {
    return this.returnItemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.returnItemService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReturnItemDto: UpdateReturnItemDto,
  ) {
    return this.returnItemService.update(id, updateReturnItemDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.returnItemService.remove(id);
  }
}
