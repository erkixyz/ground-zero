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
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiBody } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UserEntity } from "./entities/user.entity";

type SessionReq = Request & { session: any };

@ApiTags('auth')
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login', description: 'Authenticates user and sets session cookie.' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Logged in successfully', type: UserEntity })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Post("login")
  async login(@Body() dto: LoginDto, @Req() req: SessionReq) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException("Vale e-post või parool");
    req.session.userId = user.id;
    return user;
  }

  @ApiCookieAuth()
  @ApiOperation({ summary: 'Logout', description: 'Destroys the current session.' })
  @ApiResponse({ status: 204, description: 'Logged out' })
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Req() req: SessionReq) {
    req.session.destroy(() => undefined);
  }

  @ApiCookieAuth()
  @ApiOperation({ summary: 'Current user', description: 'Returns the currently authenticated user.' })
  @ApiResponse({ status: 200, description: 'Current user', type: UserEntity })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @Get("me")
  async me(@Req() req: SessionReq) {
    if (!req.session?.userId) throw new UnauthorizedException();
    const user = await this.authService.getUser(req.session.userId);
    if (!user) throw new UnauthorizedException();
    return user;
  }

  @ApiOperation({ summary: 'Forgot password', description: 'Sends password reset email. Always returns 204 regardless of whether email exists.' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 204 })
  @Post("forgot-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
  }

  @ApiOperation({ summary: 'Reset password', description: 'Resets password using a token from the email link.' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 400, description: 'Token expired or invalid' })
  @Post("reset-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
