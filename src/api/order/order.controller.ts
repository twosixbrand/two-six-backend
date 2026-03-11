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
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CheckoutDto } from './dto/checkout.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post('checkout')
  checkout(@Body() checkoutDto: CheckoutDto) {
    return this.orderService.checkout(checkoutDto);
  }

  @Post('wompi-webhook')
  async handleWompiWebhook(@Body() payload: any) {
    console.log('Recibido webhook de Wompi:', JSON.stringify(payload));

    // Wompi sends events like 'transaction.updated'
    if (payload && payload.event === 'transaction.updated' && payload.data && payload.data.transaction) {
      const transactionId = payload.data.transaction.id;

      try {
        // We reuse verifyPayment because it securely fetches the real status from Wompi API
        await this.orderService.verifyPayment(transactionId);
        return { success: true, message: 'Webhook procesado y orden actualizada' };
      } catch (error) {
        console.error('Error procesando webhook de Wompi:', error);
        // Return 200 anyway so Wompi doesn't retry infinitely if it's a non-retriable error
        return { success: false, error: error.message };
      }
    }

    return { success: true, message: 'Evento ignorado' };
  }

  @Post('verify-payment')
  verifyPayment(@Body('transactionId') transactionId: string) {
    return this.orderService.verifyPayment(transactionId);
  }

  @Post('check-status')
  checkStatus(@Body('reference') reference: string) {
    return this.orderService.checkStatusByReference(reference);
  }

  @Post('validate-discount')
  validateDiscount(@Body('code') code: string, @Body('email') email: string) {
    return this.orderService.validateDiscountCode(code, email);
  }

  @Post('track')
  trackOrder(@Body() trackOrderDto: { orderReference: string; email: string }) {
    return this.orderService.trackOrder(trackOrderDto);
  }

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  @Get('customer/:email')
  getOrdersByCustomer(@Param('email') email: string) {
    return this.orderService.findByCustomerEmail(email);
  }

  @Get('by-reference/:reference')
  findByReference(@Param('reference') reference: string) {
    return this.orderService.findByReference(reference);
  }


  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.remove(id);
  }
}