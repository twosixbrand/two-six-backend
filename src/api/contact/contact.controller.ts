import { Controller, Post, Body } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactDto } from './dto/contact.dto';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public() // It must be public to allow frontend visitors to submit
  @Post()
  async submitContact(@Body() contactDto: ContactDto) {
    return this.contactService.sendContactMessage(contactDto);
  }
}
