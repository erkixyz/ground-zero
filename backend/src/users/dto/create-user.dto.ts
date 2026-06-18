import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty({ message: 'Eesnimi on kohustuslik' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty({ message: 'Perenimi on kohustuslik' })
  lastName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail({}, { message: 'Vigane e-posti aadress' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6, { message: 'Parool peab olema vähemalt 6 tähemärki' })
  password: string;
}
