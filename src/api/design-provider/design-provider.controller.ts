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
  create(@Body() createDesignProviderDto: CreateDesignProviderDto) { // El método del controlador se mantiene como 'create' para la ruta POST estándar
    return this.designProviderService.createDesignProvider(createDesignProviderDto);
  }

  @Get('design/:id_design')
  findByDesignId(@Param('id_design', ParseIntPipe) id_design: number) {
    return this.designProviderService.findByDesignId(id_design);
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
