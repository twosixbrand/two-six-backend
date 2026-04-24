/**
 * Inicialización de Sentry para el Backend de Two Six (Nest.js).
 *
 * Este archivo DEBE importarse antes de cualquier otro módulo en `main.ts`.
 * Configura captura automática de errores, traces y filtros de ruido.
 *
 * DSN: Se inyecta como variable de entorno SENTRY_DSN.
 * Crear un proyecto nuevo en Sentry → Nest.js → copiar DSN.
 */
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.warn('[Sentry] SENTRY_DSN no configurado — monitoreo desactivado.');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',

    // Muestreo de traces: 30% en producción, 100% en desarrollo
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.3 : 1.0,

    // Profiling de rendimiento
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

    integrations: [nodeProfilingIntegration()],

    // Filtrar ruido: errores esperados que no requieren alertas
    beforeSend(event) {
      const message = event.exception?.values?.[0]?.value || '';

      // Errores de validación de NestJS (input del usuario) — no son bugs
      if (
        message.includes('Bad Request') ||
        message.includes('Validation failed')
      ) {
        return null;
      }

      // 404s — recursos que no existen, no un error del servidor
      if (message.includes('Cannot') && message.includes('Not Found')) {
        return null;
      }

      // Errores de autenticación — comportamiento esperado
      if (message.includes('Unauthorized') || message.includes('Forbidden')) {
        return null;
      }

      // REDACTAR PII de cualquier request body
      if (event.request?.data) {
        try {
          const bodyString =
            typeof event.request.data === 'string'
              ? event.request.data
              : JSON.stringify(event.request.data);

          if (
            bodyString.includes('email') ||
            bodyString.includes('document') ||
            bodyString.includes('password')
          ) {
            event.request.data = '[REDACTED PII]';
          }
        } catch {
          // Ignore serialization errors
        }
      }

      // Redactar headers sensibles
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      return event;
    },
  });

  console.log('[Sentry] Monitoreo inicializado correctamente.');
}
