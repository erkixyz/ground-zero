import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { EventsGateway } from "../events/events.gateway";

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly events: EventsGateway,
  ) {}

  async upload(noteId: number, file: Express.Multer.File) {
    const ext = file.originalname.includes(".")
      ? file.originalname.slice(file.originalname.lastIndexOf("."))
      : "";
    const key = `notes/${noteId}/${randomUUID()}${ext}`;

    this.logger.log(`Laen faili: "${file.originalname}" (${file.size} B) → ${key}`);
    await this.storage.upload(key, file.buffer, file.mimetype);

    const record = await this.prisma.write.noteFile.create({
      data: {
        noteId,
        filename: file.originalname,
        key,
        size: file.size,
        mimeType: file.mimetype,
      },
    });
    this.logger.log(`Fail salvestatud: id=${record.id}, noteId=${noteId}`);
    this.events.notesChanged();
    return record;
  }

  async remove(fileId: number) {
    const file = await this.prisma.read.noteFile.findUnique({
      where: { id: fileId },
    });
    if (!file) throw new NotFoundException("Faili ei leitud");

    this.logger.log(`Kustutan faili: id=${fileId}, key=${file.key}`);
    await this.storage.delete(file.key);
    await this.prisma.write.noteFile.delete({ where: { id: fileId } });
    this.logger.log(`Fail kustutatud: id=${fileId}`);
    this.events.notesChanged();
  }

  async removeAllForNote(noteId: number) {
    const files = await this.prisma.read.noteFile.findMany({
      where: { noteId },
    });
    if (files.length > 0) {
      this.logger.log(`Kustutan ${files.length} faili noteId=${noteId} jaoks`);
      await Promise.all(files.map((f) => this.storage.delete(f.key)));
    }
  }

  async withUrls(files: { id: number; filename: string; key: string; size: number; mimeType: string; createdAt: Date }[]) {
    return Promise.all(
      files.map(async (f) => ({
        ...f,
        url: await this.storage.presignedGet(f.key),
      })),
    );
  }
}
