import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { INestApplication } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Las rutas ahora se construyen dinámicamente
const routes = [
  { 
    path: '/api/auth', 
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001', 
    secure: false, 
    ws: false 
  },
  { 
    path: '/api/auctions', 
    target: process.env.AUCTION_SERVICE_URL || 'http://auction-service:3002', 
    secure: true, 
    ws: false 
  },
  { 
    path: '/api/chat', 
    target: process.env.CHAT_SERVICE_URL || 'http://chat-service:3003', 
    secure: true, 
    ws: false 
  },
  { 
    path: '/auction', 
    target: (process.env.AUCTION_SERVICE_URL || 'http://auction-service:3002').replace('http', 'ws'), 
    secure: false, 
    ws: true 
  },
  { 
    path: '/chat', 
    target: (process.env.CHAT_SERVICE_URL || 'http://chat-service:3003').replace('http', 'ws'), 
    secure: false, 
    ws: true 
  },
];

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(AppModule);
  // Usar process.env.PORT para compatibilidad con Cloud Run, con fallback a 3000
  const port = parseInt(process.env.PORT || '3000', 10);

  app.enableCors({ origin: '*' });

  const jwtAuthGuard = app.get(JwtAuthGuard);

  routes.filter(r => !r.ws).forEach(route => {
    // Extraemos el prefijo que el microservicio espera (ej. /auth, /auctions)
    const servicePrefix = route.path.replace('/api', '');

    const proxy = createProxyMiddleware({
      target: route.target,
      changeOrigin: true,
      // La nueva regla de reescritura que arregla el problema
      pathRewrite: (path, req) => {
        // 'path' es la URL después de que Express quita el prefijo del 'app.use'.
        // Ejemplo: para /api/auth/register, el 'path' es '/register'.
        // La función devuelve servicePrefix + path -> '/auth' + '/register' -> '/auth/register'
        // ¡Esta es la ruta correcta que el auth-service espera!
        return servicePrefix + path;
      },
      on: {
        proxyReq: (proxyReq, req: any, res) => {
          if (route.secure && req.user) {
            proxyReq.setHeader('x-user-payload', JSON.stringify(req.user));
          }
          fixRequestBody(proxyReq, req);
        },
      }
    });

    const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = { switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }) } as any;
        const canActivate = await Promise.resolve(jwtAuthGuard.canActivate(context));
        if (canActivate) {
          next();
        } else {
          res.status(401).send({ message: 'Unauthorized' });
        }
      } catch (err) {
        res.status(401).send({ message: 'Unauthorized', error: (err as Error).message });
      }
    };

    if (route.secure) {
      app.use(route.path, authMiddleware, proxy);
    } else {
      app.use(route.path, proxy);
    }
  });

  const server = app.getHttpServer();
  server.on('upgrade', (req, socket, head) => {
    const matchingProxy = routes.find(route => route.ws && req.url?.startsWith(route.path));
    if (matchingProxy) {
      const proxyMiddleware = createProxyMiddleware({ target: matchingProxy.target, ws: true, changeOrigin: true });
      proxyMiddleware.upgrade?.(req, socket, head);
      console.log(`Redirigiendo WebSocket para ${req.url} a ${matchingProxy.target}`);
    } else {
      socket.destroy();
    }
  });

  await app.listen(port);
  console.log(`🚀 API Gateway escuchando en el puerto ${port}`);
}

bootstrap();
