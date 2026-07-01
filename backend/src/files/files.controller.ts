import {
  Controller,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { FilesService } from "./files.service";
import { NoteFileEntity } from "../notes/entities/note-file.entity";
import { Public } from "../auth/decorators/roles.decorator";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@ApiTags('files')
@Controller("notes/:noteId/files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Public()
  @ApiOperation({ summary: 'Upload file to note', description: 'Attach a file to a note. Max size: 10 MB.' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'noteId', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'File to upload (max 10 MB)' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 200, type: NoteFileEntity })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_FILE_SIZE },
      storage: undefined, // memoryStorage (default)
    }),
  )
  upload(
    @Param("noteId", ParseIntPipe) noteId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("Fail puudub");
    return this.filesService.upload(noteId, file);
  }

  @Public()
  @ApiOperation({ summary: 'Delete file from note' })
  @ApiParam({ name: 'noteId', type: Number })
  @ApiParam({ name: 'fileId', type: Number })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @Delete(":fileId")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("fileId", ParseIntPipe) fileId: number) {
    return this.filesService.remove(fileId);
  }
}
