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

  @Post('verify-payment')
  verifyPayment(@Body('transactionId') transactionId: string) {
    return this.orderService.verifyPayment(transactionId);
  }

  @Post('check-status')
  checkStatus(@Body('reference') reference: string) {
    return this.orderService.checkStatusByReference(reference);
  }

  @Post('track')
  trackOrder(@Body() trackOrderDto: { orderId: number; email: string }) {
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