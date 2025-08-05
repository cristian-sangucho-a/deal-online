// api-gateway/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { INestApplication } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

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
    path: '/auction/socket.io',
    target: (process.env.AUCTION_SERVICE_URL || 'http://auction-service:3002').replace('http', 'ws'),
    secure: false,
    ws: true
  },
  {
    path: '/chat/socket.io',
    target: (process.env.CHAT_SERVICE_URL || 'http://chat-service:3003').replace('http', 'ws'),
    secure: false,
    ws: true
  },
];

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(AppModule);
  const port = parseInt(process.env.PORT || '3000', 10);

  app.enableCors({ origin: '*' });

  const jwtAuthGuard = app.get(JwtAuthGuard);

  const createAuthMiddlewareForRoute = (routePath: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Excepciones para rutas públicas de subastas
      if (routePath === '/api/auctions' && req.method === 'GET') {
        const isListing = req.path === '/';
        
        // --- INICIO DE LA CORRECCIÓN ---
        // La expresión regular ahora solo coincide con IDs numéricos (ej: /123),
        // por lo que ya no coincide erróneamente con '/my-auctions'.
        const isDetails = /^\/\d+$/.test(req.path);
        // --- FIN DE LA CORRECCIÓN ---

        if (isListing || isDetails) {
          return next(); // Es una ruta pública, se salta la autenticación.
        }
      }

      // Para todas las demás rutas (incluyendo GET /api/auctions/my-auctions),
      // se aplica el guardia de autenticación.
      try {
        const context = { switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }) } as any;
        const canActivate = await Promise.resolve(jwtAuthGuard.canActivate(context));
        if (canActivate) {
          next();
        } else {
          res.status(401).send({ message: 'Unauthorized: Invalid token' });
        }
      } catch (err) {
        res.status(401).send({ message: 'Unauthorized: Token required', error: (err as Error).message });
      }
    };
  };

  // Configurar proxies para rutas HTTP (sin cambios en esta sección)
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
      app.use(route.path, createAuthMiddlewareForRoute(route.path), proxy);
    } else {
      app.use(route.path, proxy);
    }
  });

  // Configurar proxies para rutas WebSocket (sin cambios)
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
