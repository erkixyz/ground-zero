import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../better-auth";
import { PrismaService } from "../../prisma/prisma.service";
import { IS_PUBLIC_KEY } from "../decorators/roles.decorator";

export type RequestUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const session = await auth.api
      .getSession({ headers: fromNodeHeaders(req.headers) })
      .catch(() => null);
    if (!session?.user) throw new UnauthorizedException("Autentimine kohustuslik");

    const user = await this.prisma.read.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, firstName: true, lastName: true, email: true, roles: true },
    });
    if (!user) throw new UnauthorizedException("Kasutajat ei leitud");

    req["currentUser"] = user;
    return true;
  }
}
