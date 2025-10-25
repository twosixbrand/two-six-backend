import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS
  app.enableCors();

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  // Habilitar validaciones globales
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Ignora propiedades que no están en el DTO

  }));
  await app.listen(process.env.PORT ?? 3050);
}
bootstrap();
