import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const organisationSelect = {
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
export class OrganisationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.read.organisation.findMany({
      orderBy: { name: "asc" },
      select: organisationSelect,
    });
  }

  async findOne(id: string) {
    const org = await this.prisma.read.organisation.findUnique({
      where: { id },
      select: organisationSelect,
    });
    if (!org) throw new NotFoundException("Organisatsiooni ei leitud");
    return org;
  }

  async search(q: string) {
    const term = q.trim();
    if (!term) return [];
    return this.prisma.read.organisation.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { regCode: { contains: term, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      take: 10,
      select: organisationSelect,
    });
  }

  async create(data: { name: string; regCode?: string; street?: string; city?: string; zip?: string; country?: string }) {
    return this.prisma.write.organisation.create({
      data: {
        name: data.name.trim(),
        regCode: data.regCode?.trim() || null,
        street: data.street?.trim() || null,
        city: data.city?.trim() || null,
        zip: data.zip?.trim() || null,
        country: data.country?.trim() || null,
      },
      select: organisationSelect,
    });
  }

  async update(id: string, data: { name?: string; regCode?: string; street?: string; city?: string; zip?: string; country?: string }) {
    const org = await this.prisma.write.organisation.findUnique({ where: { id } });
    if (!org) throw new NotFoundException("Organisatsiooni ei leitud");

    const updateData: Record<string, string | null> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.regCode !== undefined) updateData.regCode = data.regCode?.trim() || null;
    if (data.street !== undefined) updateData.street = data.street?.trim() || null;
    if (data.city !== undefined) updateData.city = data.city?.trim() || null;
    if (data.zip !== undefined) updateData.zip = data.zip?.trim() || null;
    if (data.country !== undefined) updateData.country = data.country?.trim() || null;

    return this.prisma.write.organisation.update({
      where: { id },
      data: updateData,
      select: organisationSelect,
    });
  }

  async remove(id: string) {
    const org = await this.prisma.write.organisation.findUnique({ where: { id } });
    if (!org) throw new NotFoundException("Organisatsiooni ei leitud");
    await this.prisma.write.organisation.delete({ where: { id } });
  }
}
