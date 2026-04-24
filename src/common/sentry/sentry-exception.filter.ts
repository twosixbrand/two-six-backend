/**
 * Filtro global de excepciones con Sentry para NestJS.
 *
 * Captura automáticamente todas las excepciones no manejadas
 * y las envía a Sentry con contexto de request.
 *
 * Se registra como filtro global en `main.ts`.
 */
import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Solo capturamos errores del servidor (5xx), no errores del cliente (4xx)
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      Sentry.captureException(exception);
    }

    // Delegar al filtro base de NestJS para que la respuesta HTTP se envíe normalmente
    super.catch(exception, host);
  }
}
