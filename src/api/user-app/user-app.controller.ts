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
import { UserAppService } from './user-app.service';
import { CreateUserAppDto } from './dto/create-user-app.dto';
import { UpdateUserAppDto } from './dto/update-user-app.dto';

@Controller('user-app')
export class UserAppController {
  constructor(private readonly userAppService: UserAppService) {}

  @Post()
  create(@Body() createUserAppDto: CreateUserAppDto) {
    return this.userAppService.create(createUserAppDto);
  }

  @Get()
  findAll() {
    return this.userAppService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userAppService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserAppDto: UpdateUserAppDto) {
    return this.userAppService.update(id, updateUserAppDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userAppService.remove(id);
  }
}
