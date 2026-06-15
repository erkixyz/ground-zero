import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { StorageModule } from "./storage/storage.module";
import { EventsModule } from "./events/events.module";
import { NotesModule } from "./notes/notes.module";

@Module({
  imports: [PrismaModule, StorageModule, EventsModule, NotesModule],
  controllers: [AppController],
})
export class AppModule {}
