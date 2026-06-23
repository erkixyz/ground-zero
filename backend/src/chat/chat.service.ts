import { Injectable, Logger } from "@nestjs/common";
import { Response } from "express";
import { ChatDto } from "./dto/chat.dto";
import { PrismaService } from "../prisma/prisma.service";
import { hashPassword } from "../auth/better-auth";

interface OllamaMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls?: OllamaToolCall[];
}

interface OllamaToolCall {
  function: { name: string; arguments: Record<string, unknown> };
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_note",
      description: "Create a new note in the system",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Note title" },
          content: { type: "string", description: "Note body text" },
          category: { type: "string", enum: ["isiklik", "too", "ideed", "muu"], description: "Category (optional)" },
          pinned: { type: "boolean", description: "Pin the note (optional, default false)" },
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_note",
      description: "Update an existing note. Only provided fields are changed.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "integer", description: "ID of the note to update" },
          title: { type: "string", description: "New title (optional)" },
          content: { type: "string", description: "New content (optional)" },
          category: { type: "string", enum: ["isiklik", "too", "ideed", "muu", ""], description: "New category; empty string clears it (optional)" },
          pinned: { type: "boolean", description: "New pinned state (optional)" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_note",
      description: "Permanently delete a note by its ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "integer", description: "ID of the note to delete" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_user",
      description: "Create a new user account. A temporary password is generated automatically and returned.",
      parameters: {
        type: "object",
        properties: {
          firstName: { type: "string", description: "First name" },
          lastName: { type: "string", description: "Last name" },
          email: { type: "string", description: "Email address (must be unique)" },
        },
        required: ["firstName", "lastName", "email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_user",
      description: "Update an existing user. Only provided fields are changed.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "User ID" },
          firstName: { type: "string", description: "New first name (optional)" },
          lastName: { type: "string", description: "New last name (optional)" },
          email: { type: "string", description: "New email address (optional)" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_user",
      description: "Permanently delete a user by their ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "User ID to delete" },
        },
        required: ["id"],
      },
    },
  },
] as const;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly ollamaUrl = process.env.OLLAMA_URL ?? "http://ollama-lb:11434";
  private readonly defaultModel = process.env.OLLAMA_MODEL ?? "llama3.2:3b";

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
      `IMPORTANT: Answer ONLY based on the data provided below. Do NOT invent or guess.\n\n` +
      `CURRENT DATA (live from database):\n\n` +
      `NOTES — exactly ${notes.length} total:\n${notesBlock}\n\n` +
      `USERS — exactly ${users.length} total:\n${usersBlock}\n\n` +
      `You can also CREATE, UPDATE, and DELETE notes and users using the provided tools.\n` +
      `When asked to make changes, use the appropriate tool. After a tool executes successfully, confirm the action to the user.\n` +
      `Answer in the same language the user writes in.`;
  }

  private async executeTool(name: string, args: Record<string, unknown>): Promise<string> {
    try {
      switch (name) {
        case "create_note": {
          const note = await this.prisma.write.note.create({
            data: {
              title: args.title as string,
              content: args.content as string,
              category: (args.category as string) || null,
              pinned: (args.pinned as boolean) ?? false,
            },
          });
          return `Note created: id=${note.id}, title="${note.title}"`;
        }

        case "update_note": {
          const data: Record<string, unknown> = {};
          if (args.title !== undefined) data.title = args.title;
          if (args.content !== undefined) data.content = args.content;
          if (args.category !== undefined) data.category = (args.category as string) || null;
          if (args.pinned !== undefined) data.pinned = args.pinned;
          const note = await this.prisma.write.note.update({
            where: { id: args.id as number },
            data,
          });
          return `Note id=${note.id} updated successfully`;
        }

        case "delete_note": {
          await this.prisma.write.note.delete({ where: { id: args.id as number } });
          return `Note id=${args.id} deleted successfully`;
        }

        case "create_user": {
          const email = (args.email as string).toLowerCase().trim();
          const existing = await this.prisma.write.user.findUnique({ where: { email } });
          if (existing) return `Error: a user with email ${email} already exists`;

          const tempPassword = Math.random().toString(36).slice(2, 10) + "Aa1!";
          const firstName = args.firstName as string;
          const lastName = args.lastName as string;

          const user = await this.prisma.write.user.create({
            data: {
              firstName,
              lastName,
              name: `${firstName} ${lastName}`.trim(),
              email,
              emailVerified: true,
              accounts: {
                create: { accountId: email, providerId: "credential", password: hashPassword(tempPassword) },
              },
            },
          });
          return `User created: ${user.firstName} ${user.lastName} <${user.email}>, id=${user.id}. Temporary password: ${tempPassword}`;
        }

        case "update_user": {
          const existing = await this.prisma.read.user.findUnique({ where: { id: args.id as string } });
          if (!existing) return `Error: user id=${args.id} not found`;

          const data: Record<string, unknown> = {};
          if (args.firstName) data.firstName = args.firstName;
          if (args.lastName) data.lastName = args.lastName;
          if (args.email) data.email = (args.email as string).toLowerCase().trim();
          if (args.firstName || args.lastName) {
            data.name = `${args.firstName ?? existing.firstName} ${args.lastName ?? existing.lastName}`.trim();
          }

          const user = await this.prisma.write.user.update({ where: { id: args.id as string }, data });
          return `User id=${user.id} updated: ${user.firstName} ${user.lastName} <${user.email}>`;
        }

        case "delete_user": {
          const user = await this.prisma.write.user.findUnique({ where: { id: args.id as string } });
          if (!user) return `Error: user id=${args.id} not found`;
          await this.prisma.write.user.delete({ where: { id: args.id as string } });
          return `User ${user.firstName} ${user.lastName} (id=${user.id}) deleted`;
        }

        default:
          return `Unknown tool: ${name}`;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Tool ${name} failed: ${msg}`);
      return `Error: ${msg}`;
    }
  }

  async stream(dto: ChatDto, res: Response): Promise<void> {
    const model = dto.model ?? this.defaultModel;
    let systemPrompt = await this.buildSystemPrompt();
    const messages: OllamaMessage[] = dto.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as OllamaMessage["role"], content: m.content }));

    const MAX_ITERATIONS = 6;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      let ollamaRes: globalThis.Response;
      try {
        ollamaRes = await fetch(`${this.ollamaUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, system: systemPrompt, messages, tools: TOOLS, stream: false }),
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

      const data = await ollamaRes.json();
      const reply: OllamaMessage = data.message;

      if (!reply.tool_calls?.length) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.write(reply.content ?? "");
        res.end();
        return;
      }

      // Execute all tool calls in this round
      messages.push({ role: "assistant", content: reply.content ?? "", tool_calls: reply.tool_calls });

      for (const tc of reply.tool_calls) {
        const result = await this.executeTool(tc.function.name, tc.function.arguments);
        this.logger.log(`Tool: ${tc.function.name}(${JSON.stringify(tc.function.arguments)}) → ${result}`);
        messages.push({ role: "tool", content: result });
      }

      // Rebuild prompt so the AI sees the updated state
      systemPrompt = await this.buildSystemPrompt();
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.write("Viga: liiga palju tööriistakutseid.");
    res.end();
  }
}
