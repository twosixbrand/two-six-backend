import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Patch,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerImageConfig } from '../../common/utils/multer.config';
import { MasterDesignService } from './master-design.service';
import { CreateMasterDesignDto } from './dto/create-master-design.dto';
import { UpdateMasterDesignDto } from './dto/update-master-design.dto';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Master Design')
@UseGuards(JwtAuthGuard)
@Controller('master-design')
export class MasterDesignController {
  constructor(private readonly masterDesignService: MasterDesignService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { ...multerImageConfig }))
  create(
    @Body() createMasterDesignDto: CreateMasterDesignDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.masterDesignService.create(createMasterDesignDto, file);
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
  @UseInterceptors(FileInterceptor('file', { ...multerImageConfig }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMasterDesignDto: UpdateMasterDesignDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.masterDesignService.update(id, updateMasterDesignDto, file);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.masterDesignService.remove(id);
  }
}
