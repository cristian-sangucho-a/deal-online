// --- INICIO DE LA CORRECCIÓN ---
import * as crypto from 'crypto';
(global as any).crypto = crypto;
// --- FIN DE LA CORRECCIÓN ---
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Usar process.env.PORT para compatibilidad con Cloud Run, con fallback a 3003
  const port = parseInt(process.env.PORT, 10) || 3003;

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(port);
  console.log(`🚀 Chat Service está escuchando en el puerto ${port}`);
}
bootstrap();