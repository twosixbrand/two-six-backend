import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { MasterDesignService } from './master-design.service';
import { CreateMasterDesignDto } from './dto/create-master-design.dto';
import { UpdateMasterDesignDto } from './dto/update-master-design.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Master Design')
@Controller('master-design')
export class MasterDesignController {
  constructor(private readonly masterDesignService: MasterDesignService) { }

  @Post()
  create(@Body() createMasterDesignDto: CreateMasterDesignDto) {
    return this.masterDesignService.create(createMasterDesignDto);
  }

  @Get()
  findAll() {
    return this.masterDesignService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.masterDesignService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMasterDesignDto: UpdateMasterDesignDto,
  ) {
    return this.masterDesignService.update(id, updateMasterDesignDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.masterDesignService.remove(id);
  }
}
