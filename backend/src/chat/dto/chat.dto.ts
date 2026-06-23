import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class MessageDto {
  @IsIn(["user", "assistant", "system"])
  role: "user" | "assistant" | "system";

  @IsString()
  content: string;
}

export class ChatDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];

  @IsOptional()
  @IsString()
  model?: string;
}
