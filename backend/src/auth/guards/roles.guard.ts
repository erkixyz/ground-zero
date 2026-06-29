import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { RequestUser } from "./auth.guard";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user: RequestUser | undefined =
      context.switchToHttp().getRequest()["currentUser"];
    if (!user) return false;

    // GLOBAL_ADMIN bypasses all role requirements
    if (user.roles.includes("GLOBAL_ADMIN")) return true;

    const ok = required.some((r) => user.roles.includes(r));
    if (!ok) throw new ForbiddenException("Puuduvad vajalikud õigused");
    return true;
  }
}
