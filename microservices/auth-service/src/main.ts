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
    console.log('📦 Variables de entorno:');
    console.log(`PORT: ${process.env.PORT}`);
    console.log(`DB_HOST: ${process.env.DB_HOST}`);
    console.log(`DB_DATABASE: ${process.env.DB_DATABASE}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    
    const app = await NestFactory.create(AppModule);
    
    // Usar process.env.PORT para compatibilidad con Cloud Run, con fallback a 3001
    const port = parseInt(process.env.PORT || '3001', 10);
    console.log(`🌐 Configurando servidor en puerto: ${port}`);

    // Habilitar CORS para permitir peticiones desde el frontend
    app.enableCors();
    console.log('✅ CORS habilitado');

    // Usar un ValidationPipe global para validar automáticamente los DTOs
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si se envían propiedades no permitidas
      transform: true, // Transforma los payloads a instancias de DTO
    }));
    console.log('✅ Validation pipes configurados');

    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Auth Service está escuchando en el puerto ${port}`);
    console.log(`🔗 URL: http://0.0.0.0:${port}`);
  } catch (error) {
    console.error('❌ Error al iniciar Auth Service:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}
bootstrap();
