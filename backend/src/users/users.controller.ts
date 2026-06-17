import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

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

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.usersService.remove(id);
  }
}
