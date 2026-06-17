import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service";

type SessionReq = Request & { session: any };

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() body: { email: string; password: string }, @Req() req: SessionReq) {
    if (!body.email || !body.password) {
      throw new UnauthorizedException("E-post ja parool on kohustuslikud");
    }

    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) throw new UnauthorizedException("Vale e-post või parool");

    req.session.userId = user.id;
    return user;
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Req() req: SessionReq) {
    req.session.destroy(() => undefined);
  }

  @Get("me")
  async me(@Req() req: SessionReq) {
    if (!req.session?.userId) throw new UnauthorizedException();
    const user = await this.authService.getUser(req.session.userId);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
