import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

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
  async loginCustomer(@Body() loginDto: LoginDto) {
    return this.authService.loginCustomer(loginDto.email);
  }

  @Post('customer/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyCustomerOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyCustomerOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }
}
