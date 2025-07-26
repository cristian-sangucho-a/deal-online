import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuctionService } from './auction.service';
import { AuctionController } from './auction.controller';
import { AuctionGateway } from './auction.gateway';
import { Product } from './entities/product.entity';
import { Auction } from './entities/auction.entity';
import { Bid } from './entities/bid.entity';
import { JwtModule } from '@nestjs/jwt'; // CORRECCIÓN: Importación añadida
import { ConfigService, ConfigModule } from '@nestjs/config'; // CORRECCIÓN: ConfigModule añadido

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Auction, Bid]),
    // CORRECCIÓN: Se importa JwtModule para que el Gateway pueda verificar tokens.
    JwtModule.registerAsync({
        imports: [ConfigModule], // Necesario para usar ConfigService
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
            secret: config.get<string>('JWT_SECRET'),
        }),
    }),
  ],
  controllers: [AuctionController],
  providers: [AuctionService, AuctionGateway],
})
export class AuctionModule {}
