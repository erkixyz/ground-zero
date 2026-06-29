import { Body, Controller, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { ChatService } from "./chat.service";
import { ChatDto } from "./dto/chat.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { RequestUser } from "../auth/guards/auth.guard";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() body: ChatDto, @Res() res: Response, @CurrentUser() user: RequestUser): Promise<void> {
    const caller = { id: user.id, roles: user.roles };
    await this.chatService.stream(body, res, caller);
  }
}
