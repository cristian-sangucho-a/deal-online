import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuctionService } from './auction.service';
import { AuctionController } from './auction.controller';
import { AuctionGateway } from './auction.gateway';
import { Product } from './entities/product.entity';
import { Auction } from './entities/auction.entity';
import { Bid } from './entities/bid.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
// --- INICIO DE LA MODIFICACIÓN ---
import { ClientsModule, Transport } from '@nestjs/microservices';
// --- FIN DE LA MODIFICACIÓN ---
import { User } from './entities/user.entity'; // <-- AÑADE ESTA LÍNEA

@Module({
  imports: [
    // --- INICIO DE LA CORRECCIÓN ---
    // Añadimos la entidad User para que TypeORM la reconozca
    TypeOrmModule.forFeature([Product, Auction, Bid, User]),
    // --- FIN DE LA CORRECCIÓN ---
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
    // --- INICIO DE LA MODIFICACIÓN ---
    // Se registra el cliente de RabbitMQ para poder inyectarlo en el servicio
    // y enviar eventos al microservicio de correos.
    ClientsModule.registerAsync([
      {
        name: 'EMAIL_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        // --- INICIO DE LA CORRECCIÓN ---
        useFactory: (configService: ConfigService) => {
          const rmqUrl = configService.get<string>('RABBITMQ_URL');
          const rmqQueue = configService.get<string>('RABBITMQ_EMAIL_QUEUE');

          // Validamos que las variables de entorno existan
          if (!rmqUrl || !rmqQueue) {
            throw new Error('RabbitMQ URL o Queue no están definidas en las variables de entorno.');
          }

          return {
            transport: Transport.RMQ,
            options: {
              urls: [rmqUrl], // Ahora TypeScript sabe que esto es un string
              queue: rmqQueue, // y que esto también lo es
              queueOptions: {
                durable: true,
              },
            },
          };
        },
        // --- FIN DE LA CORRECCIÓN ---
      },
    ]),
  ],
  controllers: [AuctionController],
  providers: [AuctionService, AuctionGateway],
})
export class AuctionModule {}
