import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: number;
  email: string;
  name: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET no está definido en las variables de entorno.');
    }

    // --- INICIO DE LA CORRECCIÓN ---
    // Se elimina el 'as StrategyOptions' para que TypeScript infiera el tipo correcto
    // y no entre en conflicto con las definiciones del constructor.
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
    // --- FIN DE LA CORRECCIÓN ---
  }

  async validate(payload: JwtPayload): Promise<any> {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token inválido o malformado.');
    }
    return { userId: payload.sub, email: payload.email, name: payload.name, role: payload.role };
  }
}
