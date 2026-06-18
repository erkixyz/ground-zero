import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserEntity } from "../auth/entities/user.entity";

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

  @ApiOperation({ summary: 'Create user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, type: UserEntity })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: { firstName: string; lastName: string; email: string; password: string }) {
    if (!body.firstName?.trim()) throw new BadRequestException("Eesnimi on kohustuslik");
    if (!body.lastName?.trim()) throw new BadRequestException("Perenimi on kohustuslik");
    if (!body.email?.trim()) throw new BadRequestException("E-post on kohustuslik");
    if (!body.password) throw new BadRequestException("Parool on kohustuslik");

    return this.usersService.create({
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email: body.email.trim().toLowerCase(),
      password: body.password,
    });
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, type: UserEntity })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { firstName?: string; lastName?: string; email?: string; password?: string },
  ) {
    return this.usersService.update(id, {
      firstName: body.firstName?.trim() || undefined,
      lastName: body.lastName?.trim() || undefined,
      email: body.email?.trim().toLowerCase() || undefined,
      password: body.password || undefined,
    });
  }

  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 403, description: 'Cannot delete self' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseIntPipe) id: number, @Req() req: Request & { session: any }) {
    if (req.session?.userId === id) {
      throw new ForbiddenException("Ei saa iseennast kustutada");
    }
    await this.usersService.remove(id);
  }
}
