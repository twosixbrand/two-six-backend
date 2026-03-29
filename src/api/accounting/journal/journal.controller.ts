import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { JournalService } from './journal.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';

@Controller('accounting/journal')
export class JournalController {
  constructor(private readonly journalService: JournalService) { }

  @Get()
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('source_type') source_type?: string,
  ) {
    return this.journalService.findAll({ startDate, endDate, source_type });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.journalService.findOne(id);
  }

  @Post()
  create(@Body() createJournalEntryDto: CreateJournalEntryDto) {
    return this.journalService.create(createJournalEntryDto);
  }
}
