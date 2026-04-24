import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  Patch,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerImageConfig } from '../../common/utils/multer.config';
import { PqrService } from './pqr.service';
import { CreatePqrDto } from './dto/create-pqr.dto';
import { UpdatePqrStatusDto } from './dto/update-pqr-status.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
@Controller('pqr')
export class PqrController {
  constructor(private readonly pqrService: PqrService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 5, multerImageConfig))
  create(
    @Body() createPqrDto: CreatePqrDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.pqrService.create(createPqrDto, images);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.pqrService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pqrService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('observation') observation?: string,
  ) {
    if (!status) {
      throw new BadRequestException('Status is required');
    }
    return this.pqrService.updateStatus(+id, status, observation);
  }
}
