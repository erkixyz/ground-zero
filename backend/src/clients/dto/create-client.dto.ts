import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateClientDto {
  @ApiProperty({ example: "Acme OÜ" })
  @IsString()
  @IsNotEmpty({ message: "Nimi on kohustuslik" })
  name: string;

  @ApiPropertyOptional({ example: "12345678" })
  @IsOptional()
  @IsString()
  regCode?: string;
}
