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
    transform: true, // Transforma el payload a instancias de DTO
  }));
  const port = process.env.PORT ?? 3050;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Port configured: ${port}`);
}
bootstrap();
