import { Controller, Post, Body, HttpCode, HttpStatus, Get, Put, Param, ParseIntPipe } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';

@Controller('newsletter')
export class NewsletterController {
    constructor(private readonly newsletterService: NewsletterService) { }

    @Post('subscribe')
    @HttpCode(HttpStatus.OK)
    async subscribe(@Body() subscribeDto: SubscribeDto) {
        const result = await this.newsletterService.subscribe(subscribeDto.email);
        return {
            message: '¡Gracias por suscribirte al Club Two Six!',
            data: result,
        };
    }

    @Get()
    findAll() {
        return this.newsletterService.findAll();
    }

    @Put(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateSubscriberDto,
    ) {
        return this.newsletterService.update(id, updateDto);
    }
}
