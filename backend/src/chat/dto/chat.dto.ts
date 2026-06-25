import { IsArray, IsIn, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class MessageDto {
  @IsIn(["user", "assistant", "system"])
  role: "user" | "assistant" | "system";

  @IsString()
  content: string;
}

export class ConfirmedCallDto {
  @IsString()
  name: string;

  @IsObject()
  args: Record<string, unknown>;
}

export class ChatDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmedCallDto)
  confirmedCalls?: ConfirmedCallDto[];
}
