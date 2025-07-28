import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus'; // <-- AÑADIR

@Module({
  imports: [
    PrometheusModule.register(), // <-- AÑADIR ESTA LÍNEA
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    EmailModule,
  ],
})
export class AppModule {}
