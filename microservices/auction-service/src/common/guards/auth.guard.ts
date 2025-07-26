import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userPayload = request.headers['x-user-payload'];
    if (!userPayload) {
      throw new UnauthorizedException('No se encontró la información del usuario en la petición.');
    }
    try {
      request.user = JSON.parse(userPayload as string);
      return true;
    } catch (e) {
      throw new UnauthorizedException('El payload del usuario es inválido.');
    }
  }
}