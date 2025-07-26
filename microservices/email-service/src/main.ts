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

  // Validamos que las variables existan. Si no, la aplicación no debe iniciar.
  if (!rabbitmqUrl || !emailQueue) {
    throw new Error('Las variables de entorno de RabbitMQ (URL y QUEUE) no están definidas.');
  }
  // --- FIN DE LA CORRECCIÓN ---

  // Ahora creamos el microservicio usando las variables validadas
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
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

  await app.listen();
  console.log('🚀 Email Service está escuchando eventos de RabbitMQ');
}
bootstrap();
