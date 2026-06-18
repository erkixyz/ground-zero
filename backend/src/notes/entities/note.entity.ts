import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoteFileEntity } from './note-file.entity';

class AuthorDto {
  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;
}

export class NoteEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'My Note' })
  title: string;

  @ApiProperty({ example: 'Note content goes here.' })
  content: string;

  @ApiPropertyOptional({ example: 'work' })
  category: string | null;

  @ApiProperty({ example: false })
  pinned: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: [NoteFileEntity] })
  files: NoteFileEntity[];

  @ApiPropertyOptional({ type: AuthorDto })
  author: AuthorDto | null;

  @ApiPropertyOptional({ example: 1 })
  authorId: number | null;
}
