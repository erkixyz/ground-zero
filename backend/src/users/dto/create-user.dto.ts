import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { ALL_ROLES } from "../../auth/permissions";

export class CreateUserDto {
  @ApiProperty({ example: "John" })
  @IsString()
  @IsNotEmpty({ message: "Eesnimi on kohustuslik" })
  firstName: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  @IsNotEmpty({ message: "Perenimi on kohustuslik" })
  lastName: string;

  @ApiProperty({ example: "john@example.com" })
  @IsEmail({}, { message: "Vigane e-posti aadress" })
  email: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @MinLength(6, { message: "Parool peab olema vähemalt 6 tähemärki" })
  password: string;

  @ApiPropertyOptional({
    type: [String],
    enum: ALL_ROLES,
    example: ["USER"],
    description: "One or more roles. Defaults to [USER] if not provided.",
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ALL_ROLES, { each: true, message: "Vigane rolli väärtus" })
  roles?: string[];
}
