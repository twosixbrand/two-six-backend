import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { GenderService } from './gender.service';

@Controller('gender')
export class GenderController {
  constructor(private readonly genderService: GenderService) {}

  @Get()
  findAll() {
    return this.genderService.findAll();
  }
}
