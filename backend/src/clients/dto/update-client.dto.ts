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
}
