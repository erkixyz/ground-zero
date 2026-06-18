import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'My Note' })
  @IsString()
  @IsNotEmpty({ message: 'Pealkiri on kohustuslik' })
  title: string;

  @ApiProperty({ example: 'Note content goes here.' })
  @IsString()
  @IsNotEmpty({ message: 'Sisu on kohustuslik' })
  content: string;

  @ApiPropertyOptional({ example: 'work' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  pinned?: boolean;
}
