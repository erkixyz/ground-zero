import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const clientSelect = {
  id: true,
  name: true,
  regCode: true,
  street: true,
  city: true,
  zip: true,
  country: true,
  createdAt: true,
} as const;

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.read.client.findMany({
      orderBy: { name: "asc" },
      select: clientSelect,
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.read.client.findUnique({
      where: { id },
      select: { ...clientSelect, users: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    if (!client) throw new NotFoundException("Klienti ei leitud");
    return client;
  }

  async search(q: string) {
    const term = q.trim();
    if (!term) return [];
    return this.prisma.read.client.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { regCode: { contains: term, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      take: 10,
      select: clientSelect,
    });
  }

  async create(data: { name: string; regCode?: string; street?: string; city?: string; zip?: string; country?: string }) {
    return this.prisma.write.client.create({
      data: {
        name: data.name.trim(),
        regCode: data.regCode?.trim() || null,
        street: data.street?.trim() || null,
        city: data.city?.trim() || null,
        zip: data.zip?.trim() || null,
        country: data.country?.trim() || null,
      },
      select: clientSelect,
    });
  }

  async update(id: string, data: { name?: string; regCode?: string; street?: string; city?: string; zip?: string; country?: string }) {
    const client = await this.prisma.write.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException("Klienti ei leitud");

    const updateData: Record<string, string | null> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.regCode !== undefined) updateData.regCode = data.regCode?.trim() || null;
    if (data.street !== undefined) updateData.street = data.street?.trim() || null;
    if (data.city !== undefined) updateData.city = data.city?.trim() || null;
    if (data.zip !== undefined) updateData.zip = data.zip?.trim() || null;
    if (data.country !== undefined) updateData.country = data.country?.trim() || null;

    return this.prisma.write.client.update({
      where: { id },
      data: updateData,
      select: clientSelect,
    });
  }

  async remove(id: string) {
    const client = await this.prisma.write.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException("Klienti ei leitud");
    await this.prisma.write.client.delete({ where: { id } });
  }
}
