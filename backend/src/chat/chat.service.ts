import { Injectable, Logger } from "@nestjs/common";
import { Response } from "express";
import { ChatDto, MessageDto } from "./dto/chat.dto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly ollamaUrl = process.env.OLLAMA_URL ?? "http://ollama-lb:11434";
  private readonly defaultModel = process.env.OLLAMA_MODEL ?? "qwen2:0.5b";

  constructor(private readonly prisma: PrismaService) {}

  private async buildSystemPrompt(): Promise<string> {
    const [notes, users] = await Promise.all([
      this.prisma.read.note.findMany({
        orderBy: { createdAt: "desc" },
        include: { author: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.read.user.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
      }),
    ]);

    const notesBlock = notes.length === 0
      ? "  (no notes yet)"
      : notes.map((n) => {
          const author = n.author ? `${n.author.firstName} ${n.author.lastName}` : "Anonymous";
          const meta = [n.category, n.pinned ? "pinned" : ""].filter(Boolean).join(", ");
          const content = n.content.length > 300 ? n.content.slice(0, 300) + "…" : n.content;
          return `  [id:${n.id}] "${n.title}" — ${author}${meta ? ` (${meta})` : ""}\n  ${content}`;
        }).join("\n\n");

    const usersBlock = users.length === 0
      ? "  (no users yet)"
      : users.map((u) =>
          `  [id:${u.id}] ${u.firstName} ${u.lastName} <${u.email}> joined ${u.createdAt.toISOString().slice(0, 10)}`
        ).join("\n");

    return `You are a helpful assistant for the Ground Zero notes application.\n` +
      `You have real-time access to all notes and users in the system — use this data to answer questions accurately.\n\n` +
      `NOTES (${notes.length} total):\n${notesBlock}\n\n` +
      `USERS (${users.length} total):\n${usersBlock}\n\n` +
      `When the user asks about notes or users, refer to the data above. ` +
      `If something is not in the data, say so clearly. ` +
      `Answer in the same language the user writes in.`;
  }

  async stream(dto: ChatDto, res: Response): Promise<void> {
    const model = dto.model ?? this.defaultModel;

    const systemPrompt = await this.buildSystemPrompt();
    const systemMessage: MessageDto = { role: "system", content: systemPrompt };
    const userMessages = dto.messages.filter((m) => m.role !== "system");
    const messages = [systemMessage, ...userMessages];

    let ollamaRes: globalThis.Response;
    try {
      ollamaRes = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: true }),
      });
    } catch {
      res.status(503).json({ error: "AI service unavailable" });
      return;
    }

    if (!ollamaRes.ok) {
      const body = await ollamaRes.text().catch(() => "");
      this.logger.error(`Ollama ${ollamaRes.status}: ${body}`);
      res.status(503).json({ error: "AI service error" });
      return;
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");

    const reader = ollamaRes.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.message?.content) res.write(json.message.content);
            if (json.done) { res.end(); return; }
          } catch {
            this.logger.warn(`Unparseable Ollama line: ${line}`);
          }
        }
      }
    } catch (err) {
      this.logger.error("Stream read error", err);
    } finally {
      res.end();
    }
  }
}
