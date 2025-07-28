// --- INICIO DE LA CORRECCIÓN ---
import * as crypto from 'crypto';
(global as any).crypto = crypto;
// --- FIN DE LA CORRECCIÓN ---
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  try {
    console.log('🚀 Iniciando Auth Service...');
    console.log(`PORT environment variable: ${process.env.PORT}`);
    
    const app = await NestFactory.create(AppModule);
    console.log('✅ NestJS app created successfully');
    
    // Usar process.env.PORT para compatibilidad con Cloud Run, con fallback a 3001
    const port = parseInt(process.env.PORT || '3001', 10);
    console.log(`🔧 Configurando puerto: ${port}`);

    // Habilitar CORS para permitir peticiones desde el frontend
    app.enableCors();
    console.log('✅ CORS habilitado');

    // Usar un ValidationPipe global para validar automáticamente los DTOs
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si se envían propiedades no permitidas
      transform: true, // Transforma los payloads a instancias de DTO
    }));
    console.log('✅ ValidationPipe configurado');

    console.log(`🌐 Intentando escuchar en puerto ${port} en 0.0.0.0...`);
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Auth Service está escuchando en el puerto ${port}`);
  } catch (error) {
    console.error('❌ Error al iniciar Auth Service:', error);
    throw error;
  }
}
bootstrap();
