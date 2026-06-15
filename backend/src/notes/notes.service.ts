import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.read.note.findMany({ orderBy: { createdAt: "desc" } });
  }

  create(title: string, content: string) {
    return this.prisma.write.note.create({ data: { title, content } });
  }

  remove(id: number) {
    return this.prisma.write.note.delete({ where: { id } });
  }
}
