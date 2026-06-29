import { Injectable, Logger } from "@nestjs/common";
import { Response } from "express";
import { ChatDto } from "./dto/chat.dto";
import { PrismaService } from "../prisma/prisma.service";
import { hashPassword } from "../auth/better-auth";

type Caller = { id: string; roles: string[] } | null;

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
      name: "list_notes",
      description: "List all notes, optionally filtered by category or pinned state",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["isiklik", "too", "ideed", "muu"], description: "Filter by category (optional)" },
          pinned: { type: "boolean", description: "Filter by pinned state (optional)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_note",
      description: "Get a single note by its ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "integer", description: "Note ID" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "count_notes",
      description: "Count notes, optionally filtered by category or pinned state",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["isiklik", "too", "ideed", "muu"], description: "Filter by category (optional)" },
          pinned: { type: "boolean", description: "Filter by pinned state (optional)" },
        },
      },
    },
  },
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
      name: "list_users",
      description: "List all users",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user",
      description: "Get a single user by their ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "User ID" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "count_users",
      description: "Count total number of users",
      parameters: { type: "object", properties: {} },
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
  {
    type: "function",
    function: {
      name: "list_clients",
      description: "List all clients in the client registry",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_client",
      description: "Get a single client by their ID, including their linked users",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Client ID" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "count_clients",
      description: "Count total number of clients",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_client",
      description: "Create a new client in the client registry",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Client name (e.g. company name)" },
          regCode: { type: "string", description: "Registration code (optional)" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_client",
      description: "Update an existing client. Only provided fields are changed.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Client ID" },
          name: { type: "string", description: "New name (optional)" },
          regCode: { type: "string", description: "New registration code; empty string clears it (optional)" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_client",
      description: "Permanently delete a client by their ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Client ID to delete" },
        },
        required: ["id"],
      },
    },
  },
] as const;

const MUTATING_TOOLS = new Set([
  "create_note", "update_note", "delete_note",
  "create_user", "update_user", "delete_user",
  "create_client", "update_client", "delete_client",
]);

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly ollamaUrl = process.env.OLLAMA_URL ?? "http://ollama-lb:11434";
  private readonly defaultModel = process.env.OLLAMA_MODEL ?? "llama3.2:3b";

  constructor(private readonly prisma: PrismaService) {}

  private buildSystemPrompt(): string {
    return (
      `You are a data assistant for the Ground Zero notes application.\n` +
      `Your job is to help users view and manage notes, users and clients.\n\n` +
      `AVAILABLE TOOLS: list_notes, get_note, count_notes, create_note, update_note, delete_note, ` +
      `list_users, get_user, count_users, create_user, update_user, delete_user, ` +
      `list_clients, get_client, count_clients, create_client, update_client, delete_client.\n\n` +
      `STRICT RULES:\n` +
      `1. NEVER give programming advice, code examples, or technical explanations.\n` +
      `2. NEVER make up data. Only report what the tools return.\n` +
      `3. For read requests (list, show, count, find, search) — call the appropriate read tool.\n` +
      `4. For write requests (create, add, update, change, rename, delete, remove) — call the appropriate write tool.\n` +
      `5. After a tool executes, report the result to the user in plain language.\n` +
      `6. Answer in the same language the user writes in.`
    );
  }

  // ── Notes ──────────────────────────────────────────────────────────────────

  private async listNotes(args: Record<string, unknown>): Promise<string> {
    const where: Record<string, unknown> = {};
    if (args.category) where.category = args.category;
    if (args.pinned !== undefined) where.pinned = args.pinned;

    const notes = await this.prisma.read.note.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { firstName: true, lastName: true } } },
    });

    if (notes.length === 0) return "No notes found.";

    return notes
      .map((n) => {
        const author = n.author ? `${n.author.firstName} ${n.author.lastName}` : "Anonymous";
        const meta = [n.category, n.pinned ? "pinned" : ""].filter(Boolean).join(", ");
        return `[id:${n.id}] "${n.title}" — ${author}${meta ? ` (${meta})` : ""}`;
      })
      .join("\n");
  }

  private async getNote(args: Record<string, unknown>): Promise<string> {
    const note = await this.prisma.read.note.findUnique({
      where: { id: args.id as number },
      include: { author: { select: { firstName: true, lastName: true } } },
    });

    if (!note) return `Note id=${args.id} not found.`;

    const author = note.author ? `${note.author.firstName} ${note.author.lastName}` : "Anonymous";
    const meta = [note.category, note.pinned ? "pinned" : ""].filter(Boolean).join(", ");
    return (
      `[id:${note.id}] "${note.title}"` +
      `\nAuthor: ${author}` +
      (meta ? `\nMeta: ${meta}` : "") +
      `\nCreated: ${note.createdAt.toISOString().slice(0, 10)}` +
      `\n\n${note.content}`
    );
  }

  private async countNotes(args: Record<string, unknown>): Promise<string> {
    const where: Record<string, unknown> = {};
    if (args.category) where.category = args.category;
    if (args.pinned !== undefined) where.pinned = args.pinned;

    const count = await this.prisma.read.note.count({ where });
    const filter = [
      args.category ? `category="${args.category}"` : "",
      args.pinned !== undefined ? `pinned=${args.pinned}` : "",
    ]
      .filter(Boolean)
      .join(", ");

    return filter ? `${count} note(s) matching ${filter}.` : `${count} note(s) total.`;
  }

  private async createNote(args: Record<string, unknown>): Promise<string> {
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

  private async updateNote(args: Record<string, unknown>): Promise<string> {
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

  private async deleteNote(args: Record<string, unknown>): Promise<string> {
    await this.prisma.write.note.delete({ where: { id: args.id as number } });
    return `Note id=${args.id} deleted successfully`;
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  private async listUsers(): Promise<string> {
    const users = await this.prisma.read.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
    });

    if (users.length === 0) return "No users found.";

    return users
      .map((u) => `[id:${u.id}] ${u.firstName} ${u.lastName} <${u.email}> joined ${u.createdAt.toISOString().slice(0, 10)}`)
      .join("\n");
  }

  private async getUser(args: Record<string, unknown>): Promise<string> {
    const user = await this.prisma.read.user.findUnique({
      where: { id: args.id as string },
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
    });

    if (!user) return `User id=${args.id} not found.`;

    return (
      `[id:${user.id}] ${user.firstName} ${user.lastName}` +
      `\nEmail: ${user.email}` +
      `\nJoined: ${user.createdAt.toISOString().slice(0, 10)}`
    );
  }

  private async countUsers(): Promise<string> {
    const count = await this.prisma.read.user.count();
    return `${count} user(s) total.`;
  }

  private async createUser(args: Record<string, unknown>, caller: Caller): Promise<string> {
    if (!caller || !caller.roles.includes("GLOBAL_ADMIN")) return "Error: only admins can create users";

    const email = (args.email as string).toLowerCase().trim();
    const existing = await this.prisma.write.user.findUnique({ where: { email } });
    if (existing) return `Error: a user with email ${email} already exists`;

    const tempPassword = Math.random().toString(36).slice(2, 10) + "Aa1!";
    const firstName = args.firstName as string;
    const lastName = args.lastName as string;

    const count = await this.prisma.read.user.count();

    const user = await this.prisma.write.user.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        email,
        emailVerified: true,
        roles: count === 0 ? ["GLOBAL_ADMIN"] : ["USER"],
        accounts: {
          create: { accountId: email, providerId: "credential", password: hashPassword(tempPassword) },
        },
      },
    });
    return `User created: ${user.firstName} ${user.lastName} <${user.email}>, id=${user.id}. Temporary password: ${tempPassword}`;
  }

  private async updateUser(args: Record<string, unknown>, caller: Caller): Promise<string> {
    if (!caller || !caller.roles.includes("GLOBAL_ADMIN")) return "Error: only admins can update users";

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

  private async deleteUser(args: Record<string, unknown>, caller: Caller): Promise<string> {
    if (!caller || !caller.roles.includes("GLOBAL_ADMIN")) return "Error: only admins can delete users";
    if (caller.id === (args.id as string)) return "Error: cannot delete your own account";

    const user = await this.prisma.write.user.findUnique({ where: { id: args.id as string } });
    if (!user) return `Error: user id=${args.id} not found`;

    await this.prisma.write.user.delete({ where: { id: args.id as string } });
    return `User ${user.firstName} ${user.lastName} (id=${user.id}) deleted`;
  }

  // ── Clients ────────────────────────────────────────────────────────────────

  private async listClients(): Promise<string> {
    const clients = await this.prisma.read.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, regCode: true },
    });
    if (clients.length === 0) return "No clients found.";
    return clients
      .map((c) => `[id:${c.id}] "${c.name}"${c.regCode ? ` (reg: ${c.regCode})` : ""}`)
      .join("\n");
  }

  private async getClient(args: Record<string, unknown>): Promise<string> {
    const client = await this.prisma.read.client.findUnique({
      where: { id: args.id as string },
      select: {
        id: true,
        name: true,
        regCode: true,
        createdAt: true,
        users: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!client) return `Client id=${args.id} not found.`;
    const users = client.users.length
      ? client.users.map((u) => `  - ${u.firstName} ${u.lastName} <${u.email}>`).join("\n")
      : "  (no linked users)";
    return (
      `[id:${client.id}] "${client.name}"` +
      (client.regCode ? `\nReg code: ${client.regCode}` : "") +
      `\nCreated: ${client.createdAt.toISOString().slice(0, 10)}` +
      `\nUsers:\n${users}`
    );
  }

  private async countClients(): Promise<string> {
    const count = await this.prisma.read.client.count();
    return `${count} client(s) total.`;
  }

  private async createClient(args: Record<string, unknown>): Promise<string> {
    const client = await this.prisma.write.client.create({
      data: {
        name: (args.name as string).trim(),
        regCode: (args.regCode as string | undefined)?.trim() || null,
      },
    });
    return `Client created: id=${client.id}, name="${client.name}"${client.regCode ? `, reg: ${client.regCode}` : ""}`;
  }

  private async updateClient(args: Record<string, unknown>): Promise<string> {
    const existing = await this.prisma.read.client.findUnique({ where: { id: args.id as string } });
    if (!existing) return `Error: client id=${args.id} not found`;
    const data: Record<string, string | null> = {};
    if (args.name !== undefined) data.name = (args.name as string).trim();
    if (args.regCode !== undefined) data.regCode = (args.regCode as string)?.trim() || null;
    const client = await this.prisma.write.client.update({ where: { id: args.id as string }, data });
    return `Client id=${client.id} updated: "${client.name}"${client.regCode ? `, reg: ${client.regCode}` : ""}`;
  }

  private async deleteClient(args: Record<string, unknown>): Promise<string> {
    const client = await this.prisma.write.client.findUnique({ where: { id: args.id as string } });
    if (!client) return `Error: client id=${args.id} not found`;
    await this.prisma.write.client.delete({ where: { id: args.id as string } });
    return `Client "${client.name}" (id=${client.id}) deleted`;
  }

  // ── Dispatcher ─────────────────────────────────────────────────────────────

  private async executeTool(name: string, args: Record<string, unknown>, caller: Caller): Promise<string> {
    try {
      switch (name) {
        case "list_notes":   return await this.listNotes(args);
        case "get_note":     return await this.getNote(args);
        case "count_notes":  return await this.countNotes(args);
        case "create_note":  return await this.createNote(args);
        case "update_note":  return await this.updateNote(args);
        case "delete_note":  return await this.deleteNote(args);
        case "list_users":   return await this.listUsers();
        case "get_user":     return await this.getUser(args);
        case "count_users":  return await this.countUsers();
        case "create_user":  return await this.createUser(args, caller);
        case "update_user":  return await this.updateUser(args, caller);
        case "delete_user":  return await this.deleteUser(args, caller);
        case "list_clients": return await this.listClients();
        case "get_client":   return await this.getClient(args);
        case "count_clients":return await this.countClients();
        case "create_client":return await this.createClient(args);
        case "update_client":return await this.updateClient(args);
        case "delete_client":return await this.deleteClient(args);
        default:             return `Unknown tool: ${name}`;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Tool ${name} failed: ${msg}`);
      return `Error: ${msg}`;
    }
  }

  // ── Stream ─────────────────────────────────────────────────────────────────

  async stream(dto: ChatDto, res: Response, caller: Caller): Promise<void> {
    const model = dto.model ?? this.defaultModel;
    const systemPrompt = this.buildSystemPrompt();
    const messages: OllamaMessage[] = dto.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as OllamaMessage["role"], content: m.content }));

    // If user confirmed pending tool calls, inject them before the loop
    if (dto.confirmedCalls?.length) {
      messages.push({
        role: "assistant",
        content: "",
        tool_calls: dto.confirmedCalls.map((c) => ({
          function: { name: c.name, arguments: c.args },
        })),
      });
      for (const call of dto.confirmedCalls) {
        const result = await this.executeTool(call.name, call.args, caller);
        this.logger.log(`Confirmed: ${call.name}(${JSON.stringify(call.args)}) → ${result}`);
        messages.push({ role: "tool", content: result });
      }
    }

    const MAX_ITERATIONS = 6;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const payload = [{ role: "system" as const, content: systemPrompt }, ...messages];
      let ollamaRes: globalThis.Response;
      try {
        ollamaRes = await fetch(`${this.ollamaUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages: payload, tools: TOOLS, stream: false }),
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

      // Pause before executing any mutating tools — request confirmation from the user
      if (reply.tool_calls.some((tc) => MUTATING_TOOLS.has(tc.function.name))) {
        const confirmPayload = {
          __type: "confirm" as const,
          preview: reply.content ?? "",
          calls: reply.tool_calls.map((tc) => ({
            name: tc.function.name,
            args: tc.function.arguments,
          })),
        };
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(confirmPayload));
        res.end();
        return;
      }

      messages.push({ role: "assistant", content: reply.content ?? "", tool_calls: reply.tool_calls });

      for (const tc of reply.tool_calls) {
        const result = await this.executeTool(tc.function.name, tc.function.arguments, caller);
        this.logger.log(`Tool: ${tc.function.name}(${JSON.stringify(tc.function.arguments)}) → ${result}`);
        messages.push({ role: "tool", content: result });
      }
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.write("Viga: liiga palju tööriistakutseid.");
    res.end();
  }
}
