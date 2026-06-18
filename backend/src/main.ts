import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as session from "express-session";
import { createClient } from "redis";
import { RedisStore } from "connect-redis";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const redisClient = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
  redisClient.on("error", (err) => console.error("Redis error:", err));
  await redisClient.connect();

  app.use(
    session({
      store: new RedisStore({ client: redisClient as any }),
      secret: process.env.SESSION_SECRET || "dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      },
    }),
  );

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
    .addCookieAuth('connect.sid', {
      type: 'apiKey',
      in: 'cookie',
      name: 'connect.sid',
      description: 'Session cookie — login via POST /api/auth/login to set it automatically',
    })
    .addTag('health', 'Service health check')
    .addTag('auth', 'Session-based authentication')
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
