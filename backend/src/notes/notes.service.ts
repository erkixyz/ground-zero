import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.note.findMany({ orderBy: { createdAt: "desc" } });
  }

  create(title: string, content: string) {
    return this.prisma.note.create({ data: { title, content } });
  }

  remove(id: number) {
    return this.prisma.note.delete({ where: { id } });
  }
}
