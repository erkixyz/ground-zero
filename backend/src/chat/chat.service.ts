import { Injectable, Logger } from "@nestjs/common";
import { Response } from "express";
import { ChatDto } from "./dto/chat.dto";

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly ollamaUrl = process.env.OLLAMA_URL ?? "http://ollama-lb:11434";
  private readonly defaultModel = process.env.OLLAMA_MODEL ?? "qwen2:0.5b";

  async stream(dto: ChatDto, res: Response): Promise<void> {
    const model = dto.model ?? this.defaultModel;

    let ollamaRes: globalThis.Response;
    try {
      ollamaRes = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: dto.messages, stream: true }),
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
