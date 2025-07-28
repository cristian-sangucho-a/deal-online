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
  const configService = app.get(ConfigService);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = configService.get<number>('PORT', 3003);
  await app.listen(port);
  console.log(`🚀 Chat Service está escuchando en el puerto ${port}`);
}
bootstrap();