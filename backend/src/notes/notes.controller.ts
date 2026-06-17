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
  Post,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { NotesService } from "./notes.service";

@Controller("notes")
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll() {
    return this.notesService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() body: { title: string; content: string; category?: string; pinned?: boolean },
    @Req() req: Request & { session: any },
  ) {
    if (!body.title?.trim() || !body.content?.trim()) {
      throw new BadRequestException("title ja content on kohustuslikud");
    }
    const authorId: number | undefined = req.session?.userId ?? undefined;
    return this.notesService.create(body.title.trim(), body.content.trim(), body.category, body.pinned, authorId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.notesService.remove(id);
  }
}
