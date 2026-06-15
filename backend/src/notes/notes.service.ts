import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FilesService } from "../files/files.service";

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
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

  create(title: string, content: string) {
    return this.prisma.write.note.create({ data: { title, content } });
  }

  async remove(id: number) {
    await this.files.removeAllForNote(id);
    return this.prisma.write.note.delete({ where: { id } });
  }
}
