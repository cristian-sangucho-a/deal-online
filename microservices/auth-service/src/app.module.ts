import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/entities/user.entity';
import { PrometheusModule } from '@willsoto/nestjs-prometheus'; // <-- AÑADIR

@Module({
  imports: [
    PrometheusModule.register(), // <-- AÑADIR ESTA LÍNEA
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        
        console.log('🔍 ===== CONFIGURACIÓN SUPABASE (AUTH) =====');
        console.log(`DATABASE_URL: "${databaseUrl ? databaseUrl.substring(0, 30) + '...' : 'undefined'}"`);
        console.log('🔍 =========================================');

        if (!databaseUrl) {
          throw new Error('DATABASE_URL is required for Supabase connection');
        }

        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [User],
          synchronize: true, // Solo para desarrollo
          logging: ['error', 'warn'],
          ssl: {
            rejectUnauthorized: false,
          },
          connectTimeoutMS: 60000,
          acquireTimeoutMillis: 60000,
          timeout: 60000,
        };
      },
    }),
    AuthModule,
  ],
})
export class AppModule {}
