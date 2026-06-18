import {
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
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email.trim().toLowerCase(),
      password: dto.password,
    });
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, type: UserEntity })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, {
      firstName: dto.firstName?.trim() || undefined,
      lastName: dto.lastName?.trim() || undefined,
      email: dto.email?.trim().toLowerCase() || undefined,
      password: dto.password || undefined,
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
