// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // <-- ¡Importante! Hace que el módulo esté disponible globalmente
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Exporta el servicio para que otros módulos puedan usarlo
})
export class PrismaModule {}
