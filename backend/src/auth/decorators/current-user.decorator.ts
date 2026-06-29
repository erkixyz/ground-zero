import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { RequestUser } from "../guards/auth.guard";

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): RequestUser | undefined =>
    ctx.switchToHttp().getRequest()["currentUser"],
);
