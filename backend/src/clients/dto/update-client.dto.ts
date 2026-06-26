import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateClientDto {
  @ApiPropertyOptional({ example: "Acme OÜ" })
  @IsOptional()
  @IsString()
  name?: string;

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

  @ApiPropertyOptional({ example: "Eesti" })
  @IsOptional()
  @IsString()
  country?: string;
}
