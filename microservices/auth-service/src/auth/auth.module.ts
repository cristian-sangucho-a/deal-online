import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d', issuer: 'deal-online-auth' },
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: 'EMAIL_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        // CORRECCIÓN: Aseguramos que los valores de config.get() no sean undefined
        // antes de pasarlos, para que coincida con los tipos esperados por RmqOptions.
        useFactory: (config: ConfigService) => {
          const rabbitmqUrl = config.get<string>('RABBITMQ_URL');
          const emailQueue = config.get<string>('RABBITMQ_EMAIL_QUEUE');
          if (!rabbitmqUrl || !emailQueue) {
            throw new Error('RabbitMQ URL or Email Queue is not defined in environment variables');
          }
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl],
              queue: emailQueue,
              queueOptions: {
                durable: true,
              },
            },
          };
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
