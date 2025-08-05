// microservices/auction-service/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuctionModule } from './auction/auction.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

// Ya no es necesario importar cada entidad aquí cuando se usa autoLoadEntities

@Module({
  imports: [
    PrometheusModule.register(),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');

        console.log('🔍 ===== CONFIGURACIÓN SUPABASE (AUCTION) =====');
        console.log(
          `DATABASE_URL: "${databaseUrl ? databaseUrl.substring(0, 30) + '...' : 'undefined'}"`,
        );
        console.log('🔍 ==========================================');

        if (!databaseUrl) {
          throw new Error('DATABASE_URL is required for Supabase connection');
        }

        return {
          type: 'postgres',
          url: databaseUrl,
          // entities: [Product, Auction, Bid], // <-- ESTA LÍNEA SE ELIMINA
          autoLoadEntities: true, // <-- Y SE REEMPLAZA POR ESTA LÍNEA MÁGICA
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
    AuctionModule,
  ],
})
export class AppModule {}
