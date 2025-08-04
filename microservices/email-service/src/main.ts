import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Creamos un contexto de la aplicación para poder acceder a los servicios de forma segura
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(ConfigService);

  // --- INICIO DE LA CORRECCIÓN ---
  // Obtenemos las variables de entorno en constantes
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL');
  const emailQueue = configService.get<string>('RABBITMQ_EMAIL_QUEUE');
  const emailUser = configService.get<string>('EMAIL_USER');
  const emailPass = configService.get<string>('EMAIL_PASS');

  // Logging de configuración
  console.log('🔍 ===== CONFIGURACIÓN EMAIL SERVICE =====');
  console.log(`RABBITMQ_URL: ${rabbitmqUrl ? 'SET' : 'NOT SET'}`);
  console.log(`EMAIL_USER: ${emailUser ? 'SET' : 'NOT SET'}`);
  console.log(`EMAIL_PASS: ${emailPass ? 'SET' : 'NOT SET'}`);
  console.log(`RABBITMQ_EMAIL_QUEUE: ${emailQueue}`);
  console.log('🔍 =========================================');

  // Validamos que las variables existan. Si no, la aplicación no debe iniciar.
  if (!rabbitmqUrl || !emailQueue) {
    throw new Error('Las variables de entorno de RabbitMQ (URL y QUEUE) no están definidas.');
  }
  // --- FIN DE LA CORRECCIÓN ---

  // 1. Crear la aplicación HTTP para health checks
  const app = await NestFactory.create(AppModule);
  
  // 2. Agregar endpoint básico de health check
  app.getHttpAdapter().get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'OK', 
      service: 'email-service',
      timestamp: new Date().toISOString()
    });
  });

  // 3. Crear el microservicio RabbitMQ
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl], // Ahora TypeScript sabe que esto es un 'string'
      queue: emailQueue,   // Y que esto también es un 'string'
      queueOptions: {
        durable: true,
      },
      noAck: false, // Requerimos confirmación manual de los mensajes
    },
  });

  // Aplicamos un pipe de validación global para los DTOs de los eventos
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // 4. Iniciar ambos servicios
  await app.startAllMicroservices();
  const port = process.env.PORT || 8080;
  await app.listen(port);
  
  console.log('🚀 Email Service está escuchando eventos de RabbitMQ');
  console.log(`🌐 HTTP Server corriendo en puerto ${port}`);
}

bootstrap().catch(err => {
  console.error('❌ Error al iniciar Email Service:', err);
  process.exit(1);
});
