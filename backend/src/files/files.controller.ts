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
import { FilesService } from "./files.service";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Controller("notes/:noteId/files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

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

  @Delete(":fileId")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("fileId", ParseIntPipe) fileId: number) {
    return this.filesService.remove(fileId);
  }
}
