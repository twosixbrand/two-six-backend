import { Controller, Post, Body, HttpCode, HttpStatus, Get, Put, Param, ParseIntPipe, Query } from '@nestjs/common';
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

    @Get('unsubscribe')
    async unsubscribeEmail(@Query('email') email: string) {
        if (!email) {
            return 'Correo no ingresado.';
        }
        await this.newsletterService.unsubscribe(email);
        return `
            <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f8f8f8; color: #333;">
                    <h2 style="color: #000;">Te has dado de baja exitosamente</h2>
                    <p>Lamentamos verte partir. A partir de ahora ya no recibirás nuestros correos del Club Two Six.</p>
                </body>
            </html>
        `;
    }

    @Put(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateSubscriberDto,
    ) {
        return this.newsletterService.update(id, updateDto);
    }
}
