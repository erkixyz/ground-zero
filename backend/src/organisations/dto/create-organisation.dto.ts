import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateOrganisationDto {
  @ApiProperty({ example: "Acme OÜ" })
  @IsString()
  @IsNotEmpty({ message: "Nimi on kohustuslik" })
  name: string;

  @ApiPropertyOptional({ example: "12345678" })
  @IsOptional()
  @IsString()
  regCode?: string;

  @ApiPropertyOptional({ example: "Pärnu mnt 1" })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ example: "Tallinn" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: "10148" })
  @IsOptional()
  @IsString()
  zip?: string;

  @ApiPropertyOptional({ example: "EE" })
  @IsOptional()
  @IsString()
  country?: string;
}
