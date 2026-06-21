import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import { randomBytes, scryptSync } from "crypto";
import { createClient } from "redis";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly redis: ReturnType<typeof createClient>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {
    this.redis = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
  }

  async onModuleInit() {
    await this.redis.connect();
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.write.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return null;

    const [salt, stored] = user.password.split(":");
    const hash = scryptSync(password, salt, 64).toString("hex");
    if (hash !== stored) return null;

    return { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email };
  }

  async getUser(id: number) {
    return this.prisma.read.user.findUnique({
      where: { id },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.read.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return; // silent — ei avalda, kas e-post eksisteerib
    const token = randomBytes(32).toString("hex");
    await this.redis.set(`reset:${token}`, String(user.id), { EX: 3600 });
    await this.mail.sendPasswordReset(user.email, token);
  }

  async resetPassword(token: string, newPassword: string) {
    const userIdStr = await this.redis.get(`reset:${token}`);
    if (!userIdStr || typeof userIdStr !== "string") throw new BadRequestException("Token on aegunud või vale");
    const userId = parseInt(userIdStr, 10);
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(newPassword, salt, 64).toString("hex");
    await this.prisma.write.user.update({
      where: { id: userId },
      data: { password: `${salt}:${hash}` },
    });
    await this.redis.del(`reset:${token}`);
  }
}
