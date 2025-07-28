import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from './chat/chat.module';
import { ChatMessage } from './chat/entities/chat-message.entity';
import { PrometheusModule } from '@willsoto/nestjs-prometheus'; // <-- AÑADIR

@Module({
  imports: [
    PrometheusModule.register(), // <-- AÑADIR ESTA LÍNEA
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbHost = config.get<string>('DB_HOST');
        const isCloudSQL = dbHost && dbHost.startsWith('/cloudsql/');
        
        console.log('🔍 Configuración de DB (Chat):');
        console.log(`DB_HOST: ${dbHost}`);
        console.log(`DB_PORT: ${config.get<number>('DB_PORT')}`);
        console.log(`DB_USERNAME: ${config.get<string>('DB_USERNAME')}`);
        console.log(`DB_DATABASE: ${config.get<string>('DB_DATABASE')}`);
        console.log(`Is Cloud SQL: ${isCloudSQL}`);

        return {
          type: 'postgres',
          ...(isCloudSQL ? {
            // Configuración para Cloud SQL usando Unix socket
            host: dbHost,
          } : {
            // Configuración para desarrollo local
            host: dbHost || 'localhost',
            port: config.get<number>('DB_PORT') || 5432,
          }),
          username: config.get<string>('DB_USERNAME') || 'postgres',
          password: config.get<string>('DB_PASSWORD') || 'password',
          database: config.get<string>('DB_DATABASE') || 'chat_db',
          entities: [ChatMessage],
          synchronize: true,
          logging: ['error', 'warn'],
          ssl: isCloudSQL ? { rejectUnauthorized: false } : false,
          // Configuraciones adicionales para Cloud Run
          connectTimeoutMS: 60000,
          acquireTimeoutMillis: 60000,
          timeout: 60000,
          extra: {
            connectionTimeoutMillis: 60000,
          },
        };
      },
    }),
    ChatModule,
  ],
})
export class AppModule {}
