// --- INICIO DE LA CORRECCIÓN ---
import * as crypto from 'crypto';
(global as any).crypto = crypto;
// --- FIN DE LA CORRECCIÓN ---
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Usar process.env.PORT para compatibilidad con Cloud Run, con fallback a 3001
  const port = parseInt(process.env.PORT || '3001', 10);

  // Habilitar CORS para permitir peticiones desde el frontend
  app.enableCors();

  // Usar un ValidationPipe global para validar automáticamente los DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Elimina propiedades no definidas en el DTO
    forbidNonWhitelisted: true, // Lanza error si se envían propiedades no permitidas
    transform: true, // Transforma los payloads a instancias de DTO
  }));

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Auth Service está escuchando en el puerto ${port}`);
}
bootstrap();
