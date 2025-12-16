import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService, // Inyectamos el servicio de email
  ) { }

  /**
   * Inicia el proceso de login generando, guardando y enviando un OTP por email.
   * @param email - El correo del usuario.
   * @returns Un mensaje de confirmación.
   */
  async login(email: string): Promise<{ message: string }> {
    const user = await this.prisma.userApp.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException(`Usuario con email '${email}' no encontrado.`);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Genera OTP de 6 dígitos
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expira en 10 minutos

    const hashedOtp = await bcrypt.hash(otp, 10);

    await this.prisma.userApp.update({
      where: { email },
      data: {
        otp: hashedOtp,
        otpExpiresAt,
      },
    });

    // Envía el correo con el OTP generado
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Tu Código de Verificación para Two Six',
      html: `
        <h1>Two Six - Código de Verificación</h1>
        <p>Hola ${user.name},</p>
        <p>Usa el siguiente código para completar tu inicio de sesión. Este código es válido por 10 minutos.</p>
        <h2 style="text-align:center; color:#1a73e8; letter-spacing: 4px;">${otp}</h2>
        <p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
      `,
    });

    // Por seguridad, ya no devolvemos el OTP en la respuesta de la API.
    return {
      message: 'Se ha enviado un código OTP a tu correo electrónico.',
    };
  }

  /**
   * Verifica el OTP y si es correcto, devuelve un JWT.
   * @param email - El correo del usuario.
   * @param providedOtp - El OTP que el usuario proveyó.
   * @returns Un objeto con el accessToken.
   */
  async verifyOtp(
    email: string,
    providedOtp: string,
  ): Promise<{ accessToken: string }> {
    const user = await this.prisma.userApp.findUnique({ where: { email } });

    if (!user || !user.otp || !user.otpExpiresAt) {
      throw new UnauthorizedException('OTP no solicitado o inválido.');
    }

    if (new Date() > user.otpExpiresAt) {
      // Limpiar el OTP expirado para que no se pueda reintentar
      await this.prisma.userApp.update({
        where: { email },
        data: { otp: null, otpExpiresAt: null },
      });
      throw new UnauthorizedException('El OTP ha expirado.');
    }

    const isOtpValid = await bcrypt.compare(providedOtp, user.otp);

    if (!isOtpValid) {
      throw new UnauthorizedException('El OTP es incorrecto.');
    }

    // Limpiar el OTP después de un uso exitoso
    await this.prisma.userApp.update({
      where: { email },
      data: {
        otp: null,
        otpExpiresAt: null,
      },
    });

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }


  /**
   * Inicia el proceso de login para CLIENTES (Customer) generando, guardando y enviando un OTP por email.
   */
  async loginCustomer(email: string): Promise<{ message: string }> {
    const customer = await this.prisma.customer.findUnique({ where: { email } });

    if (!customer) {
      throw new NotFoundException(`Cliente con email '${email}' no encontrado.`);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Genera OTP de 6 dígitos
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expira en 10 minutos

    const hashedOtp = await bcrypt.hash(otp, 10);

    await this.prisma.customer.update({
      where: { email },
      data: {
        otp: hashedOtp,
        otpExpiresAt,
      },
    });

    // Envía el correo con el OTP generado
    await this.mailerService.sendMail({
      to: customer.email,
      subject: 'Tu Código de Acceso - Two Six',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="text-align: center; padding: 20px; background-color: #f8f9fa;">
            <h1 style="color: #000; margin: 0;">TWO SIX</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hola ${customer.name},</p>
            <p>Usa el siguiente código para acceder a tu historial de pedidos. Este código es válido por 10 minutos.</p>
            <h2 style="text-align:center; color:#000; letter-spacing: 4px; font-size: 32px; margin: 30px 0;">${otp}</h2>
            <p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
          </div>
        </div>
      `,
    });

    return {
      message: 'Se ha enviado un código de acceso a tu correo electrónico.',
    };
  }

  /**
   * Verifica el OTP del CLIENTE y devuelve un JWT.
   */
  async verifyCustomerOtp(
    email: string,
    providedOtp: string,
  ): Promise<{ accessToken: string; customer: any }> {
    const customer = await this.prisma.customer.findUnique({
      where: { email },
      include: { addresses: true }, // Include addresses
    });

    if (!customer || !customer.otp || !customer.otpExpiresAt) {
      throw new UnauthorizedException('Código no solicitado o inválido.');
    }

    if (new Date() > customer.otpExpiresAt) {
      await this.prisma.customer.update({
        where: { email },
        data: { otp: null, otpExpiresAt: null },
      });
      throw new UnauthorizedException('El código ha expirado.');
    }

    const isOtpValid = await bcrypt.compare(providedOtp, customer.otp);

    if (!isOtpValid) {
      throw new UnauthorizedException('El código es incorrecto.');
    }

    // Limpiar el OTP después de un uso exitoso
    await this.prisma.customer.update({
      where: { email },
      data: {
        otp: null,
        otpExpiresAt: null,
      },
    });

    // Payload para el token del cliente
    const payload = {
      sub: customer.id,
      email: customer.email,
      role: 'customer',
      name: customer.name
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        current_phone_number: customer.current_phone_number,
        shipping_address: customer.shipping_address,
        city: customer.city,
        state: customer.state,
        postal_code: customer.postal_code,
        country: customer.country,
        addresses: customer.addresses, // Return addresses
      }
    };
  }
}
