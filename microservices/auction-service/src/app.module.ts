import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuctionModule } from './auction/auction.module';
import { Product } from './auction/entities/product.entity';
import { Auction } from './auction/entities/auction.entity';
import { Bid } from './auction/entities/bid.entity';
import { PrometheusModule } from '@willsoto/nestjs-prometheus'; // <-- AÑADIR

@Module({
  imports: [
    PrometheusModule.register(), // <-- AÑADIR ESTA LÍNEA
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbHost = config.get<string>('DB_HOST');
        const dbPort = config.get<number>('DB_PORT');
        const dbUsername = config.get<string>('DB_USERNAME');
        const dbPassword = config.get<string>('DB_PASSWORD');
        const dbDatabase = config.get<string>('DB_DATABASE');
        const isCloudSQL = dbHost && dbHost.startsWith('/cloudsql/');
        
        // LOGS DE DEBUGGING DETALLADOS
        console.log('🔍 ===== CONFIGURACIÓN COMPLETA DE DB (AUCTION) =====');
        console.log(`DB_HOST: "${dbHost}"`);
        console.log(`DB_PORT: ${dbPort}`);
        console.log(`DB_USERNAME: "${dbUsername}"`);
        console.log(`DB_PASSWORD: "${dbPassword ? dbPassword.substring(0, 4) + '****' : 'undefined'}"`);
        console.log(`DB_DATABASE: "${dbDatabase}"`);
        console.log(`Is Cloud SQL: ${isCloudSQL}`);
        console.log('🔍 ===============================================');

        return {
          type: 'postgres',
          ...(isCloudSQL ? {
            // Configuración para Cloud SQL usando Unix socket
            host: dbHost,
          } : {
            // Configuración para desarrollo local
            host: dbHost || 'localhost',
            port: dbPort || 5432,
          }),
          username: dbUsername || 'postgres',
          password: dbPassword || 'password',
          database: dbDatabase || 'auction_db',
          entities: [Product, Auction, Bid], // Registra todas las entidades
          synchronize: true,
          logging: ['error', 'warn'],
          ssl: false, // Forzar SSL deshabilitado para debugging
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
    AuctionModule,
  ],
})
export class AppModule {}
