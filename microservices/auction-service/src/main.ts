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
  try {
    console.log('🚀 Iniciando Auction Service...');
    console.log(`PORT environment variable: ${process.env.PORT}`);
    
    const app = await NestFactory.create(AppModule);
    console.log('✅ NestJS app created successfully');
  
    // Usar process.env.PORT para compatibilidad con Cloud Run, con fallback a 3002
    const port = parseInt(process.env.PORT || '3002', 10);
    console.log(`🔧 Configurando puerto: ${port}`);

    app.enableCors();
    console.log('✅ CORS habilitado');
    
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    console.log('✅ ValidationPipe configurado');

    // Habilitar el adaptador de WebSockets
    app.useWebSocketAdapter(new IoAdapter(app));
    console.log('✅ WebSocket adapter configurado');

    console.log(`🌐 Intentando escuchar en puerto ${port} en 0.0.0.0...`);
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Auction Service está escuchando en el puerto ${port}`);
  } catch (error) {
    console.error('❌ Error al iniciar Auction Service:', error);
    throw error;
  }
}
bootstrap();
