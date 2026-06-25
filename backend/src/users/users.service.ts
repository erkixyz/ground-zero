import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { hashPassword } from "../auth/better-auth";
import { Role } from "../generated/prisma/client";

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  createdAt: true,
};

const userDetailSelect = {
  ...userSelect,
  chatInputHistory: true,
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

  async findOne(id: string) {
    const user = await this.prisma.read.user.findUnique({ where: { id }, select: userDetailSelect });
    if (!user) throw new NotFoundException("Kasutajat ei leitud");
    return {
      ...user,
      chatInputHistory: user.chatInputHistory ? (JSON.parse(user.chatInputHistory) as string[]) : [],
    };
  }

  async create(data: { firstName: string; lastName: string; email: string; password: string; role?: Role }) {
    const existing = await this.prisma.write.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException("Selle e-postiga kasutaja on juba olemas");

    const count = await this.prisma.read.user.count();
    const role: Role = count === 0 ? Role.ADMIN : (data.role ?? Role.USER);

    const hashedPw = hashPassword(data.password);
    const name = `${data.firstName} ${data.lastName}`.trim();

    const user = await this.prisma.write.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        name,
        email: data.email,
        emailVerified: true,
        role,
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

  async update(id: string, data: { firstName?: string; lastName?: string; email?: string; password?: string; chatInputHistory?: string[] }) {
    const user = await this.prisma.write.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Kasutajat ei leitud");

    const updateData: Record<string, string> = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.email) updateData.email = data.email;
    if (data.chatInputHistory !== undefined) updateData.chatInputHistory = JSON.stringify(data.chatInputHistory);

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

  async doVerifyEmail(token: string): Promise<boolean> {
    const verification = await this.prisma.write.verification.findFirst({
      where: { value: token },
    });
    if (!verification || verification.expiresAt < new Date()) return false;
    await this.prisma.write.user.update({
      where: { email: verification.identifier },
      data: { emailVerified: true },
    });
    await this.prisma.write.verification.delete({ where: { id: verification.id } });
    return true;
  }

  async resendVerification(email: string) {
    const user = await this.prisma.write.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, emailVerified: true },
    });
    if (!user || user.emailVerified) return;

    await this.prisma.write.verification.deleteMany({ where: { identifier: email.toLowerCase() } });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.prisma.write.verification.create({
      data: { identifier: email.toLowerCase(), value: token, expiresAt },
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const backendUrl = process.env.BETTER_AUTH_URL || process.env.APP_URL?.replace(/:\d+$/, ":3001") || "http://localhost:3001";
    const callbackURL = encodeURIComponent(`${appUrl}/verify-email?verified=true`);
    const verifyUrl = `${backendUrl}/api/users/verify-email?token=${token}&callbackURL=${callbackURL}`;

    await this.mail.sendEmailVerification(email.toLowerCase(), verifyUrl);
  }

  async getRole(id: string): Promise<Role | null> {
    const user = await this.prisma.read.user.findUnique({ where: { id }, select: { role: true } });
    return user?.role ?? null;
  }

  async updateRole(id: string, role: Role, requestingUserId: string) {
    if (id === requestingUserId) throw new ForbiddenException("Ei saa oma rolli muuta");

    const user = await this.prisma.write.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Kasutajat ei leitud");

    if (role === Role.USER) {
      const adminCount = await this.prisma.read.user.count({ where: { role: Role.ADMIN } });
      if (adminCount <= 1) throw new ForbiddenException("Süsteemis peab olema vähemalt üks Admin");
    }

    return this.prisma.write.user.update({
      where: { id },
      data: { role },
      select: userSelect,
    });
  }

  async remove(id: string) {
    const user = await this.prisma.write.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Kasutajat ei leitud");
    await this.prisma.write.user.delete({ where: { id } });
  }
}
