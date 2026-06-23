import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { WinstonModule } from "nest-winston";
import * as winston from "winston";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { StorageModule } from "./storage/storage.module";
import { EventsModule } from "./events/events.module";
import { MessagingModule } from "./messaging/messaging.module";
import { NotesModule } from "./notes/notes.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { ChatModule } from "./chat/chat.module";
import { SearchModule } from "./search/search.module";
import { HttpLoggingInterceptor } from "./logging/http-logging.interceptor";
import { MailModule } from "./mail/mail.module";

@Module({
  imports: [
    MailModule,
    WinstonModule.forRoot({
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
        }),
      ],
    }),
    PrismaModule,
    StorageModule,
    EventsModule,
    MessagingModule,
    NotesModule,
    UsersModule,
    AuthModule,
    ChatModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: HttpLoggingInterceptor },
  ],
})
export class AppModule {}
