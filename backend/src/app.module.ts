import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { StorageModule } from "./storage/storage.module";
import { EventsModule } from "./events/events.module";
import { MessagingModule } from "./messaging/messaging.module";
import { NotesModule } from "./notes/notes.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [PrismaModule, StorageModule, EventsModule, MessagingModule, NotesModule, UsersModule, AuthModule],
  controllers: [AppController],
})
export class AppModule {}
