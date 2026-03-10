import { Module } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { NewsletterController } from './newsletter.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [PrismaModule, MailerModule],
  controllers: [NewsletterController],
  providers: [NewsletterService],
})
export class NewsletterModule { }
