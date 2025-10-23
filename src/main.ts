import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS para que tus frontends puedan conectarse.
  // En producción, deberías configurarlo con orígenes específicos por seguridad.
  app.enableCors();

  // Establece un prefijo global para todas las rutas de la API
  app.setGlobalPrefix('api');

  // Habilita la validación global para los DTOs.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // Transforma el payload a una instancia del DTO
    }),
  );

  await app.listen(process.env.PORT ?? 3050); // Cambiamos a 3001
}
bootstrap();
