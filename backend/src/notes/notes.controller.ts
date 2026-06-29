import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from "@nestjs/swagger";
import { NotesService } from "./notes.service";
import { CreateNoteDto } from "./dto/create-note.dto";
import { SendNoteDto } from "./dto/send-note.dto";
import { NoteEntity } from "./entities/note.entity";
import { Public, Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { RequestUser } from "../auth/guards/auth.guard";

@ApiTags("notes")
@Controller("notes")
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Public()
  @ApiOperation({ summary: "List all notes" })
  @ApiResponse({ status: 200, type: [NoteEntity] })
  @Get()
  findAll() {
    return this.notesService.findAll();
  }

  @Public()
  @ApiOperation({ summary: "Get note by id" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, type: NoteEntity })
  @ApiResponse({ status: 404, description: "Note not found" })
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.notesService.findOne(id);
  }

  @Public()
  @ApiOperation({ summary: "Create note — attributed to the current user if logged in" })
  @ApiBody({ type: CreateNoteDto })
  @ApiResponse({ status: 201, type: NoteEntity })
  @ApiResponse({ status: 400, description: "title and content are required" })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateNoteDto, @CurrentUser() user?: RequestUser) {
    return this.notesService.create(dto.title.trim(), dto.content.trim(), dto.category, dto.pinned, user?.id);
  }

  @ApiOperation({ summary: "Send note by email" })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({ type: SendNoteDto })
  @ApiResponse({ status: 204, description: "Sent" })
  @ApiResponse({ status: 404, description: "Note not found" })
  @Post(":id/send")
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendByEmail(@Param("id", ParseIntPipe) id: number, @Body() dto: SendNoteDto) {
    await this.notesService.sendByEmail(id, dto.email);
  }

  @Public()
  @ApiOperation({ summary: "Delete note" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 204, description: "Deleted" })
  @ApiResponse({ status: 404, description: "Note not found" })
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.notesService.remove(id);
  }
}
