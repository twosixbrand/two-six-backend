import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('address')
export class AddressController {
    constructor(private readonly addressService: AddressService) { }

    @Post()
    create(@Body() createAddressDto: CreateAddressDto) {
        return this.addressService.create(createAddressDto);
    }

    @Get('customer/:customerId')
    findAllByCustomer(@Param('customerId', ParseIntPipe) customerId: number) {
        return this.addressService.findAllByCustomer(customerId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.addressService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateAddressDto: UpdateAddressDto) {
        return this.addressService.update(id, updateAddressDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.addressService.remove(id);
    }
}
