import { Injectable } from "@nestjs/common";
import { scryptSync } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

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
}
