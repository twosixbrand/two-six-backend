import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { VerifyCustomerOtpDto } from './dto/verify-customer-otp.dto';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { Public } from './decorators/public.decorator';

@Public()
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 5, ttl: 60000 } }) // Max 5 requests per 60 seconds
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }

  @Post('customer/login')
  @HttpCode(HttpStatus.OK)
  async loginCustomer(@Body() loginDto: CustomerLoginDto) {
    return this.authService.loginCustomer(loginDto.email);
  }

  @Post('customer/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyCustomerOtp(@Body() verifyOtpDto: VerifyCustomerOtpDto) {
    return this.authService.verifyCustomerOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }

  @Post('customer/register')
  async registerCustomer(@Body() registerDto: RegisterCustomerDto) {
    return this.authService.registerCustomer(registerDto);
  }
}
