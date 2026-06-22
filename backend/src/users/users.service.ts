import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { hashPassword } from "../auth/better-auth";

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

  findAll() {
    return this.prisma.read.user.findMany({
      orderBy: { createdAt: "desc" },
      select: userSelect,
    });
  }

  async create(data: { firstName: string; lastName: string; email: string; password: string }) {
    const existing = await this.prisma.write.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException("Selle e-postiga kasutaja on juba olemas");

    const hashedPw = hashPassword(data.password);
    const name = `${data.firstName} ${data.lastName}`.trim();

    const user = await this.prisma.write.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        name,
        email: data.email,
        emailVerified: true,
        accounts: {
          create: {
            accountId: data.email,
            providerId: "credential",
            password: hashedPw,
          },
        },
      },
      select: userSelect,
    });

    void this.mail.sendWelcome({ firstName: user.firstName, email: user.email });
    return user;
  }

  async update(id: string, data: { firstName?: string; lastName?: string; email?: string; password?: string }) {
    const user = await this.prisma.write.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Kasutajat ei leitud");

    const updateData: Record<string, string> = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.email) updateData.email = data.email;

    if (data.firstName || data.lastName) {
      updateData.name = `${data.firstName ?? user.firstName} ${data.lastName ?? user.lastName}`.trim();
    }

    const updated = await this.prisma.write.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });

    if (data.password) {
      const hashedPw = hashPassword(data.password);
      const credAccount = await this.prisma.write.account.findFirst({
        where: { userId: id, providerId: "credential" },
      });
      if (credAccount) {
        await this.prisma.write.account.update({
          where: { id: credAccount.id },
          data: { password: hashedPw },
        });
      } else {
        await this.prisma.write.account.create({
          data: {
            userId: id,
            accountId: user.email,
            providerId: "credential",
            password: hashedPw,
          },
        });
      }
    }

    return updated;
  }

  async remove(id: string) {
    const user = await this.prisma.write.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Kasutajat ei leitud");
    await this.prisma.write.user.delete({ where: { id } });
  }
}
