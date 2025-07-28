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
  
  // Usar process.env.PORT para compatibilidad con Cloud Run, con fallback a 3002
  const port = parseInt(process.env.PORT || '3002', 10);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Habilitar el adaptador de WebSockets
  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Auction Service está escuchando en el puerto ${port}`);
}
bootstrap();
