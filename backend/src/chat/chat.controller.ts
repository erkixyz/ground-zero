import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth/better-auth";
import { ChatService } from "./chat.service";
import { ChatDto } from "./dto/chat.dto";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() body: ChatDto, @Res() res: Response, @Req() req: Request): Promise<void> {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const caller = session?.user
      ? { id: session.user.id, role: (session.user as any).role as string ?? "USER" }
      : null;
    await this.chatService.stream(body, res, caller);
  }
}
