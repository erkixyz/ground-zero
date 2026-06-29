import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserEntity } from "../auth/entities/user.entity";
import { Public, Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { RequestUser } from "../auth/guards/auth.guard";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles("GLOBAL_ADMIN")
  @ApiOperation({ summary: "List all users" })
  @ApiResponse({ status: 200, type: [UserEntity] })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Public()
  @ApiOperation({ summary: "Verify email via token (redirect)" })
  @ApiResponse({ status: 302, description: "Redirect to callbackURL" })
  @Get("verify-email")
  async verifyEmail(
    @Query("token") token: string,
    @Query("callbackURL") callbackURL: string,
    @Res() res: Response,
  ) {
    const safe = callbackURL || "/";
    const separator = safe.includes("?") ? "&" : "?";
    const ok = await this.usersService.doVerifyEmail(token ?? "");
    return res.redirect(ok ? safe : `${safe}${separator}error=INVALID_TOKEN`);
  }

  @ApiOperation({ summary: "Get user by id" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200, type: UserEntity })
  @ApiResponse({ status: 404, description: "User not found" })
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Public()
  @ApiOperation({ summary: "Resend email verification link" })
  @ApiBody({ schema: { properties: { email: { type: "string" } } } })
  @ApiResponse({ status: 200 })
  @Post("resend-verification")
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() body: { email: string }) {
    await this.usersService.resendVerification(body.email ?? "");
    return { ok: true };
  }

  @Roles("GLOBAL_ADMIN")
  @ApiOperation({ summary: "Create user" })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, type: UserEntity })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 409, description: "Email already exists" })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email.trim().toLowerCase(),
      password: dto.password,
      roles: dto.roles,
    });
  }

  @ApiOperation({ summary: "Update user profile" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, type: UserEntity })
  @ApiResponse({ status: 404, description: "User not found" })
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: RequestUser,
  ) {
    // Allow own profile update; GLOBAL_ADMIN can update any
    if (id !== currentUser.id && !currentUser.roles.includes("GLOBAL_ADMIN")) {
      throw new Error("Puuduvad vajalikud õigused");
    }
    return this.usersService.update(id, {
      firstName: dto.firstName?.trim() || undefined,
      lastName: dto.lastName?.trim() || undefined,
      email: dto.email?.trim().toLowerCase() || undefined,
      password: dto.password || undefined,
      chatInputHistory: dto.chatInputHistory,
      ...("clientId" in dto ? { clientId: dto.clientId ?? null } : {}),
    });
  }

  @Roles("GLOBAL_ADMIN")
  @ApiOperation({ summary: "Update user roles (global admin only)" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({ schema: { properties: { roles: { type: "array", items: { type: "string" } } } } })
  @ApiResponse({ status: 200, type: UserEntity })
  @ApiResponse({ status: 403, description: "Not global admin or cannot change own roles" })
  @ApiResponse({ status: 404, description: "User not found" })
  @Patch(":id/roles")
  async updateRoles(
    @Param("id") id: string,
    @Body() body: { roles: string[] },
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.usersService.updateRoles(id, body.roles ?? [], currentUser.id);
  }

  @Roles("GLOBAL_ADMIN")
  @ApiOperation({ summary: "Delete user" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 204, description: "Deleted" })
  @ApiResponse({ status: 403, description: "Cannot delete self" })
  @ApiResponse({ status: 404, description: "User not found" })
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string, @CurrentUser() currentUser: RequestUser) {
    if (currentUser.id === id) {
      throw new Error("Ei saa iseennast kustutada");
    }
    await this.usersService.remove(id);
  }
}
