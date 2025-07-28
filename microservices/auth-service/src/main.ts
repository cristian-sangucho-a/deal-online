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
  const configService = app.get(ConfigService);

  // Habilitar CORS para permitir peticiones desde el frontend
  app.enableCors();

  // Usar un ValidationPipe global para validar automáticamente los DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Elimina propiedades no definidas en el DTO
    forbidNonWhitelisted: true, // Lanza error si se envían propiedades no permitidas
    transform: true, // Transforma los payloads a instancias de DTO
  }));

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`🚀 Auth Service está escuchando en el puerto ${port}`);
}
bootstrap();
