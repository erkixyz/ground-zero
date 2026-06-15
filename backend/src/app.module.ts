import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { NotesModule } from "./notes/notes.module";

@Module({
  imports: [PrismaModule, NotesModule],
  controllers: [AppController],
})
export class AppModule {}
