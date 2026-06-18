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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiCookieAuth } from "@nestjs/swagger";
import { NotesService } from "./notes.service";
import { CreateNoteDto } from "./dto/create-note.dto";
import { NoteEntity } from "./entities/note.entity";

@ApiTags('notes')
@Controller("notes")
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @ApiOperation({ summary: 'List all notes' })
  @ApiResponse({ status: 200, type: [NoteEntity] })
  @Get()
  findAll() {
    return this.notesService.findAll();
  }

  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create note', description: 'Session optional — if logged in, the note is attributed to the current user.' })
  @ApiBody({ type: CreateNoteDto })
  @ApiResponse({ status: 201, type: NoteEntity })
  @ApiResponse({ status: 400, description: 'title and content are required' })
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

  @ApiOperation({ summary: 'Delete note' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.notesService.remove(id);
  }
}
