import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Put,
  Param,
  ParseIntPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribe(@Body() subscribeDto: SubscribeDto) {
    const result = await this.newsletterService.subscribe(subscribeDto.email);
    return {
      message: '¡Gracias por suscribirte al Club Two Six!',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.newsletterService.findAll();
  }

  @Get('unsubscribe')
  async unsubscribeEmail(@Query('email') email: string, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!email) {
      return res.redirect(`${frontendUrl}/unsubscribe?status=error`);
    }
    await this.newsletterService.unsubscribe(email);
    return res.redirect(`${frontendUrl}/unsubscribe?status=success`);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSubscriberDto,
  ) {
    return this.newsletterService.update(id, updateDto);
  }
}
