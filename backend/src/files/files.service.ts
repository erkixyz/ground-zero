import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async upload(noteId: number, file: Express.Multer.File) {
    const ext = file.originalname.includes(".")
      ? file.originalname.slice(file.originalname.lastIndexOf("."))
      : "";
    const key = `notes/${noteId}/${randomUUID()}${ext}`;

    await this.storage.upload(key, file.buffer, file.mimetype);

    return this.prisma.write.noteFile.create({
      data: {
        noteId,
        filename: file.originalname,
        key,
        size: file.size,
        mimeType: file.mimetype,
      },
    });
  }

  async remove(fileId: number) {
    const file = await this.prisma.read.noteFile.findUnique({
      where: { id: fileId },
    });
    if (!file) throw new NotFoundException("Faili ei leitud");

    await this.storage.delete(file.key);
    await this.prisma.write.noteFile.delete({ where: { id: fileId } });
  }

  async removeAllForNote(noteId: number) {
    const files = await this.prisma.read.noteFile.findMany({
      where: { noteId },
    });
    await Promise.all(files.map((f) => this.storage.delete(f.key)));
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
