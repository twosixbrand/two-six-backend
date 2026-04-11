import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  console.log('Starting bootstrap...');
  const app = await NestFactory.create(AppModule);

  // Activar protecciones básicas HTTP (MED-05)
  app.use(helmet());

  // Habilitar CORS con orígenes controlados (HIGH-07)
  const allowedOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost:3000', 'http://localhost:5173', 'https://twosixweb.com', 'https://cms.twosixweb.com'];
    
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  // Ocultar X-Powered-By (Best Practice - Fase 6)
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  // Habilitar validaciones globales
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Ignora propiedades que no están en el DTO
    forbidNonWhitelisted: true, // Rechaza solicitudes que envíen propiedades no definidas (Mass Assignment)
    transform: true, // Transforma el payload a instancias de DTO
  }));
  const port = process.env.PORT ?? 3050;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Port configured: ${port}`);
}
bootstrap();
