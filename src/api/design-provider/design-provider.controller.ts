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
import { DesignProviderService } from './design-provider.service';
import { CreateDesignProviderDto } from './dto/create-design-provider.dto';
import { UpdateDesignProviderDto } from './dto/update-design-provider.dto';

@Controller('design-provider')
export class DesignProviderController {
  constructor(private readonly designProviderService: DesignProviderService) {}

  @Post()
  create(@Body() createDesignProviderDto: CreateDesignProviderDto) {
    return this.designProviderService.create(createDesignProviderDto);
  }

  @Get()
  findAll() {
    return this.designProviderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.designProviderService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDesignProviderDto: UpdateDesignProviderDto) {
    return this.designProviderService.update(id, updateDesignProviderDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.designProviderService.remove(id);
  }
}
