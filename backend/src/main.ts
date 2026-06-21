import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client';
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth/better-auth";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const expressApp = app.getHttpAdapter().getInstance();

  // Mount Better Auth before NestJS routing.
  // Express 5 dropped the * wildcard in route paths, so we use a middleware.
  // Better Auth uses trustedOrigins for anti-CSRF validation, not for CORS headers,
  // so we set CORS headers manually here for all /api/auth/* requests.
  const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
  expressApp.use((req: any, res: any, next: any) => {
    if (!req.path?.startsWith('/api/auth')) return next();

    const origin = req.headers.origin as string | undefined;
    if (origin === corsOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    }

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.statusCode = 204;
      res.end();
      return;
    }

    return toNodeHandler(auth)(req, res);
  });

  // Prometheus metrics
  const metricsRegistry = new Registry();
  collectDefaultMetrics({ register: metricsRegistry });

  const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [metricsRegistry],
  });

  const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [metricsRegistry],
  });

  expressApp.use((req: any, res: any, next: any) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const duration = Number(process.hrtime.bigint() - start) / 1e9;
      const route = req.route?.path ?? req.path ?? 'unknown';
      const labels = { method: req.method, route, status_code: String(res.statusCode) };
      httpRequestsTotal.inc(labels);
      httpRequestDuration.observe(labels, duration);
    });
    next();
  });

  expressApp.get('/metrics', async (_req: any, res: any) => {
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  });
  app.useWebSocketAdapter(new IoAdapter(app));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ground Zero API')
    .setDescription('REST API for Ground Zero — notes, users, file uploads and authentication.')
    .setVersion('1.0')
    .setOpenAPIVersion('3.1.0')
    .addCookieAuth('gz.session_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'gz.session_token',
      description: 'Session cookie — login via POST /api/auth/sign-in/email to set it automatically',
    })
    .addTag('health', 'Service health check')
    .addTag('users', 'User management')
    .addTag('notes', 'Notes CRUD')
    .addTag('files', 'Note file attachments')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Ground Zero API Docs',
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
