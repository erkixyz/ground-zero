import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes, scryptSync } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
  }

  findAll() {
    return this.prisma.read.user.findMany({
      orderBy: { createdAt: "desc" },
      select: userSelect,
    });
  }

  async create(data: { firstName: string; lastName: string; email: string; password: string }) {
    const existing = await this.prisma.write.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException("Selle e-postiga kasutaja on juba olemas");

    const user = await this.prisma.write.user.create({
      data: { ...data, password: this.hashPassword(data.password) },
      select: userSelect,
    });
    void this.mail.sendWelcome({ firstName: user.firstName, email: user.email });
    return user;
  }

  async update(id: number, data: { firstName?: string; lastName?: string; email?: string; password?: string }) {
    const user = await this.prisma.write.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Kasutajat ei leitud");

    const updateData: Record<string, string> = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.email) updateData.email = data.email;
    if (data.password) updateData.password = this.hashPassword(data.password);

    return this.prisma.write.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });
  }

  async remove(id: number) {
    const user = await this.prisma.write.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Kasutajat ei leitud");
    await this.prisma.write.user.delete({ where: { id } });
  }
}
