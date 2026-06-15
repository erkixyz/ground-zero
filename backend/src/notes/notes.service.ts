import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FilesService } from "../files/files.service";
import { EventsGateway } from "../events/events.gateway";

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
    private readonly events: EventsGateway,
  ) {}

  async findAll() {
    const notes = await this.prisma.read.note.findMany({
      orderBy: { createdAt: "desc" },
      include: { files: true },
    });

    return Promise.all(
      notes.map(async (note) => ({
        ...note,
        files: await this.files.withUrls(note.files),
      })),
    );
  }

  async create(title: string, content: string, category?: string, pinned?: boolean) {
    this.logger.log(`Loon märget: "${title}" [kategooria=${category ?? "—"}, tähtsustatud=${pinned ?? false}]`);
    const note = await this.prisma.write.note.create({
      data: { title, content, category: category || null, pinned: pinned ?? false },
    });
    this.logger.log(`Märge loodud: id=${note.id}`);
    this.events.notesChanged();
    return note;
  }

  async remove(id: number) {
    this.logger.log(`Kustutan märget: id=${id}`);
    await this.files.removeAllForNote(id);
    await this.prisma.write.note.delete({ where: { id } });
    this.logger.log(`Märge kustutatud: id=${id}`);
    this.events.notesChanged();
  }
}
