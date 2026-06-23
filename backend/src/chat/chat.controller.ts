import { Body, Controller, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { ChatService } from "./chat.service";
import { ChatDto } from "./dto/chat.dto";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() body: ChatDto, @Res() res: Response): Promise<void> {
    await this.chatService.stream(body, res);
  }
}
