import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from "@nestjs/swagger";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth/better-auth";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserEntity } from "../auth/entities/user.entity";
import { Role } from "../generated/prisma/client";

@ApiTags('users')
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, type: [UserEntity] })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Verify email via token (redirect)' })
  @ApiResponse({ status: 302, description: 'Redirect to callbackURL' })
  @Get('verify-email')
  async verifyEmail(
    @Query('token') token: string,
    @Query('callbackURL') callbackURL: string,
    @Res() res: Response,
  ) {
    const safe = callbackURL || '/';
    const separator = safe.includes('?') ? '&' : '?';
    const ok = await this.usersService.doVerifyEmail(token ?? '');
    return res.redirect(ok ? safe : `${safe}${separator}error=INVALID_TOKEN`);
  }

  @ApiOperation({ summary: 'Get user by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: UserEntity })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiBody({ schema: { properties: { email: { type: 'string' } } } })
  @ApiResponse({ status: 200 })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() body: { email: string }) {
    await this.usersService.resendVerification(body.email ?? "");
    return { ok: true };
  }

  @ApiOperation({ summary: 'Create user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, type: UserEntity })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto, @Req() req: Request) {
    let role: Role | undefined;
    if (dto.role) {
      const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
      if (!session?.user) throw new UnauthorizedException("Autentimine kohustuslik rolli määramiseks");
      const requesterRole = await this.usersService.getRole(session.user.id);
      if (requesterRole !== Role.ADMIN) throw new ForbiddenException("Ainult admin saab rolli määrata");
      role = dto.role as Role;
    }
    return this.usersService.create({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email.trim().toLowerCase(),
      password: dto.password,
      role,
    });
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, type: UserEntity })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, {
      firstName: dto.firstName?.trim() || undefined,
      lastName: dto.lastName?.trim() || undefined,
      email: dto.email?.trim().toLowerCase() || undefined,
      password: dto.password || undefined,
      chatInputHistory: dto.chatInputHistory,
    });
  }

  @ApiOperation({ summary: 'Update user role (admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: { properties: { role: { type: 'string', enum: ['USER', 'ADMIN'] } } } })
  @ApiResponse({ status: 200, type: UserEntity })
  @ApiResponse({ status: 403, description: 'Not admin or cannot change own role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Patch(":id/role")
  async updateRole(@Param("id") id: string, @Body() body: { role: string }, @Req() req: Request) {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session?.user) throw new UnauthorizedException("Autentimine kohustuslik");
    const requesterRole = await this.usersService.getRole(session.user.id);
    if (requesterRole !== Role.ADMIN) throw new ForbiddenException("Ainult admin saab rolle muuta");
    if (body.role !== Role.ADMIN && body.role !== Role.USER) {
      throw new ForbiddenException("Vigane rolli väärtus");
    }
    return this.usersService.updateRole(id, body.role as Role, session.user.id);
  }

  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 403, description: 'Cannot delete self' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string, @Req() req: Request) {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (session?.user?.id === id) {
      throw new ForbiddenException("Ei saa iseennast kustutada");
    }
    await this.usersService.remove(id);
  }
}
