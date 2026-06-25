import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: string) {
    const term = q.trim();
    if (!term) return { notes: [], users: [], clients: [] };

    const [notes, users, clients] = await Promise.all([
      this.prisma.read.note.findMany({
        where: {
          OR: [
            { title: { contains: term, mode: "insensitive" } },
            { content: { contains: term, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, content: true, category: true, createdAt: true },
      }),
      this.prisma.read.user.findMany({
        where: {
          OR: [
            { firstName: { contains: term, mode: "insensitive" } },
            { lastName: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, firstName: true, lastName: true, email: true },
      }),
      this.prisma.read.client.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { regCode: { contains: term, mode: "insensitive" } },
          ],
        },
        orderBy: { name: "asc" },
        take: 5,
        select: { id: true, name: true, regCode: true },
      }),
    ]);

    return { notes, users, clients };
  }
}
