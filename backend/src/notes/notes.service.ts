import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FilesService } from "../files/files.service";
import { MessagingService } from "../messaging/messaging.service";
import { StorageService } from "../storage/storage.service";
import { MailService } from "../mail/mail.service";

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
    private readonly messaging: MessagingService,
    private readonly storage: StorageService,
    private readonly mail: MailService,
  ) {}

  async findAll() {
    const notes = await this.prisma.read.note.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        files: true,
        author: { select: { firstName: true, lastName: true } },
      },
    });

    return Promise.all(
      notes.map(async (note) => ({
        ...note,
        files: await this.files.withUrls(note.files),
      })),
    );
  }

  async findOne(id: number) {
    const note = await this.prisma.read.note.findUnique({
      where: { id },
      include: {
        files: true,
        author: { select: { firstName: true, lastName: true } },
      },
    });
    if (!note) throw new NotFoundException("Märget ei leitud");
    return { ...note, files: await this.files.withUrls(note.files) };
  }

  async create(title: string, content: string, category?: string, pinned?: boolean, authorId?: string) {
    this.logger.log(`Loon märget: "${title}" [kategooria=${category ?? "—"}, tähtsustatud=${pinned ?? false}, autor=${authorId ?? "anonüümne"}]`);
    const note = await this.prisma.write.note.create({
      data: { title, content, category: category || null, pinned: pinned ?? false, authorId: authorId ?? null },
    });
    this.logger.log(`Märge loodud: id=${note.id}`);
    this.messaging.publish("notes:changed");

    if (authorId) {
      const author = await this.prisma.read.user.findUnique({
        where: { id: authorId },
        select: { email: true, firstName: true },
      });
      if (author) void this.mail.sendNoteCreated(author, { title: note.title });
    }

    return note;
  }

  async remove(id: number) {
    this.logger.log(`Kustutan märget: id=${id}`);
    await this.files.removeAllForNote(id);
    await this.prisma.write.note.delete({ where: { id } });
    this.logger.log(`Märge kustutatud: id=${id}`);
    this.messaging.publish("notes:changed");
  }

  async sendByEmail(noteId: number, toEmail: string) {
    const note = await this.prisma.read.note.findUnique({
      where: { id: noteId },
      include: {
        files: true,
        author: { select: { firstName: true, lastName: true } },
      },
    });
    if (!note) throw new NotFoundException("Märget ei leitud");

    const attachments = await Promise.all(
      note.files.map(async (f) => ({
        filename: f.filename,
        content: await this.storage.getObject(f.key),
        contentType: f.mimeType,
      })),
    );

    await this.mail.sendNote(toEmail, note, attachments);
    this.logger.log(`Märge id=${noteId} saadetud aadressile ${toEmail}, ${attachments.length} manust`);
  }
}
