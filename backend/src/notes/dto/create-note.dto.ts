import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({ example: 'My Note' })
  title: string;

  @ApiProperty({ example: 'Note content goes here.' })
  content: string;

  @ApiPropertyOptional({ example: 'work' })
  category?: string;

  @ApiPropertyOptional({ example: false, default: false })
  pinned?: boolean;
}
