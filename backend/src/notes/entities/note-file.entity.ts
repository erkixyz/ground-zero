import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NoteFileEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  noteId: number;

  @ApiProperty({ example: 'document.pdf' })
  filename: string;

  @ApiProperty({ example: 'notes/1/uuid.pdf' })
  key: string;

  @ApiProperty({ example: 204800 })
  size: number;

  @ApiProperty({ example: 'application/pdf' })
  mimeType: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ example: 'https://...' })
  url?: string;
}
