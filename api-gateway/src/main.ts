import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { INestApplication } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Las rutas ahora se construyen dinámicamente desde variables de entorno
const routes = [
  { 
    path: '/api/auth', 
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001', 
    secure: false, // Corregido: Las rutas de autenticación deben ser públicas
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
    path: '/auction/socket.io', // Ruta completa para el handshake de WS
    target: (process.env.AUCTION_SERVICE_URL || 'http://auction-service:3002').replace('http', 'ws'), 
    secure: false, 
    ws: true 
  },
  { 
    path: '/chat/socket.io', // Ruta completa para el handshake de WS
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

  // Configurar proxies para rutas HTTP
  routes.filter(r => !r.ws).forEach(route => {
    const servicePrefix = route.path.replace('/api', '');

    const proxy = createProxyMiddleware({
      target: route.target,
      changeOrigin: true,
      pathRewrite: (path, req) => {
        return servicePrefix + path;
      },
      on: {
        proxyReq: (proxyReq, req: any) => {
          if (route.secure && req.user) {
            proxyReq.setHeader('x-user-payload', JSON.stringify(req.user));
          }
          fixRequestBody(proxyReq, req);
        },
      }
    });

    if (route.secure) {
      app.use(route.path, authMiddleware, proxy);
    } else {
      app.use(route.path, proxy);
    }
  });

  // Configurar proxies para rutas WebSocket
  routes.filter(r => r.ws).forEach(route => {
      app.use(route.path, createProxyMiddleware({
          target: route.target,
          ws: true,
          changeOrigin: true,
      }));
  });

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API Gateway escuchando en el puerto ${port}`);
}

bootstrap();
