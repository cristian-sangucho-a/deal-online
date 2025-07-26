import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info: Error) {
    if (err || !user) {
      console.error(`JWT Guard Error: ${info?.message}`);
      throw err || new UnauthorizedException('Acceso no autorizado. El token es inválido o ha expirado.');
    }
    return user;
  }
}
