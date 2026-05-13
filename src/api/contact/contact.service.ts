import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ContactDto } from './dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly mailerService: MailerService) {}

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async sendContactMessage(dto: ContactDto) {
    const { name, email, message } = dto;
    const adminEmail = process.env.EMAIL_TO || 'twosixmarca@gmail.com';
    const escapedName = this.escapeHtml(name);
    const escapedEmail = this.escapeHtml(email);
    const escapedMessage = this.escapeHtml(message).replace(/\\n/g, '<br>');

    try {
      await this.mailerService.sendMail({
        to: adminEmail,
        replyTo: email,
        subject: `Nuevo mensaje de contacto de ${escapedName}`,
        html: `
          <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
            <h2>Has recibido un nuevo mensaje de tu tienda:</h2>
            <p><strong>Nombre:</strong> ${escapedName}</p>
            <p><strong>Email:</strong> ${escapedEmail}</p>
            <br/>
            <p><strong>Mensaje:</strong></p>
            <blockquote style="background: #f9f9f9; padding: 15px; border-left: 4px solid #333;">
              ${escapedMessage}
            </blockquote>
          </div>
        `,
      });

      return { success: true, message: '¡Mensaje enviado con éxito!' };
    } catch (error) {
      console.error('Error al enviar email de contacto desde el backend:', error);
      throw new InternalServerErrorException(
        'Error al enviar el mensaje. Inténtalo de nuevo más tarde.',
      );
    }
  }
}
