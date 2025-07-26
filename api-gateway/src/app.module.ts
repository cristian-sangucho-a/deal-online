import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { PrometheusModule } from '@willsoto/nestjs-prometheus'; // <-- AÑADIR ESTA LÍNEA

@Module({
  imports: [
    PrometheusModule.register(), // <-- AÑADIR ESTA LÍNEA
    // Asegúrate de haber ejecutado: npm install @nestjs/config
    ConfigModule.forRoot({ isGlobal: true }),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // Se eliminó 'async' porque no hay operaciones 'await' dentro.
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard],
  // Exportamos el guardia para poder usarlo en main.ts
  exports: [JwtAuthGuard],
})
export class AppModule {}
