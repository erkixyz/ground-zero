import { Test, TestingModule } from '@nestjs/testing';

jest.mock('../auth/better-auth', () => ({
  hashPassword: (pw: string) => `hashed:${pw}`,
  verifyPassword: jest.fn(),
  auth: { api: { getSession: jest.fn() } },
}));

import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  read: {
    note: { findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn() },
    user: { findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn() },
  },
  write: {
    note: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  },
};

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.write = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ChatService>(ChatService);
  });

  describe('buildSystemPrompt (private)', () => {
    it('contains all required tool names', () => {
      const prompt = (service as any).buildSystemPrompt() as string;
      expect(prompt).toContain('list_notes');
      expect(prompt).toContain('create_note');
      expect(prompt).toContain('delete_note');
      expect(prompt).toContain('list_users');
      expect(prompt).toContain('create_user');
      expect(prompt).toContain('delete_user');
    });

    it('instructs answering in user language', () => {
      const prompt = (service as any).buildSystemPrompt() as string;
      expect(prompt).toContain('same language the user writes');
    });
  });

  describe('executeTool (private) — notes', () => {
    it('listNotes returns formatted string', async () => {
      const notes = [
        { id: 1, title: 'Märge', pinned: false, category: null, createdAt: new Date(), author: { firstName: 'Erki', lastName: 'K' } },
      ];
      mockPrisma.read.note.findMany.mockResolvedValue(notes);

      const result = await (service as any).executeTool('list_notes', {});

      expect(result).toContain('[id:1]');
      expect(result).toContain('Märge');
      expect(result).toContain('Erki K');
    });

    it('listNotes returns "No notes found." when empty', async () => {
      mockPrisma.read.note.findMany.mockResolvedValue([]);
      const result = await (service as any).executeTool('list_notes', {});
      expect(result).toBe('No notes found.');
    });

    it('getNote returns formatted note', async () => {
      mockPrisma.read.note.findUnique.mockResolvedValue({
        id: 5, title: 'Test', content: 'Sisu', pinned: true, category: 'too',
        createdAt: new Date('2025-01-01'), author: null,
      });

      const result = await (service as any).executeTool('get_note', { id: 5 });

      expect(result).toContain('[id:5]');
      expect(result).toContain('Test');
      expect(result).toContain('Sisu');
    });

    it('getNote returns not found message', async () => {
      mockPrisma.read.note.findUnique.mockResolvedValue(null);
      const result = await (service as any).executeTool('get_note', { id: 999 });
      expect(result).toContain('not found');
    });

    it('countNotes returns total count', async () => {
      mockPrisma.read.note.count.mockResolvedValue(7);
      const result = await (service as any).executeTool('count_notes', {});
      expect(result).toContain('7');
      expect(result).toContain('total');
    });

    it('countNotes includes filter description when category set', async () => {
      mockPrisma.read.note.count.mockResolvedValue(3);
      const result = await (service as any).executeTool('count_notes', { category: 'too' });
      expect(result).toContain('3');
      expect(result).toContain('too');
    });

    it('createNote creates and returns confirmation', async () => {
      mockPrisma.write.note.create.mockResolvedValue({ id: 10, title: 'Uus märge' });
      const result = await (service as any).executeTool('create_note', { title: 'Uus märge', content: 'Sisu' });
      expect(result).toContain('id=10');
      expect(result).toContain('Uus märge');
    });

    it('updateNote updates and returns confirmation', async () => {
      mockPrisma.write.note.update.mockResolvedValue({ id: 3 });
      const result = await (service as any).executeTool('update_note', { id: 3, title: 'Muudetud' });
      expect(result).toContain('id=3');
      expect(result).toContain('updated');
    });

    it('deleteNote deletes and returns confirmation', async () => {
      mockPrisma.write.note.delete.mockResolvedValue({});
      const result = await (service as any).executeTool('delete_note', { id: 2 });
      expect(result).toContain('id=2');
      expect(result).toContain('deleted');
    });
  });

  describe('executeTool (private) — users', () => {
    it('listUsers returns formatted string', async () => {
      mockPrisma.read.user.findMany.mockResolvedValue([
        { id: 'u1', firstName: 'Erki', lastName: 'K', email: 'erki@test.ee', createdAt: new Date('2025-01-01') },
      ]);
      const result = await (service as any).executeTool('list_users', {});
      expect(result).toContain('[id:u1]');
      expect(result).toContain('erki@test.ee');
    });

    it('listUsers returns "No users found." when empty', async () => {
      mockPrisma.read.user.findMany.mockResolvedValue([]);
      const result = await (service as any).executeTool('list_users', {});
      expect(result).toBe('No users found.');
    });

    it('getUser returns formatted user', async () => {
      mockPrisma.read.user.findUnique.mockResolvedValue({
        id: 'u1', firstName: 'Erki', lastName: 'K', email: 'erki@test.ee', createdAt: new Date('2025-03-01'),
      });
      const result = await (service as any).executeTool('get_user', { id: 'u1' });
      expect(result).toContain('Erki K');
      expect(result).toContain('erki@test.ee');
    });

    it('countUsers returns total', async () => {
      mockPrisma.read.user.count.mockResolvedValue(5);
      const result = await (service as any).executeTool('count_users', {});
      expect(result).toContain('5');
    });

    it('createUser returns error when email exists', async () => {
      mockPrisma.write.user.findUnique.mockResolvedValue({ id: 'existing' });
      const result = await (service as any).executeTool('create_user', {
        firstName: 'Erki', lastName: 'K', email: 'erki@test.ee',
      });
      expect(result).toContain('Error');
      expect(result).toContain('already exists');
    });

    it('createUser creates and returns temp password', async () => {
      mockPrisma.write.user.findUnique.mockResolvedValue(null);
      mockPrisma.write.user.create.mockResolvedValue({ id: 'new', firstName: 'Erki', lastName: 'K', email: 'erki@test.ee' });
      const result = await (service as any).executeTool('create_user', {
        firstName: 'Erki', lastName: 'K', email: 'erki@test.ee',
      });
      expect(result).toContain('Temporary password');
      expect(result).toContain('erki@test.ee');
    });

    it('updateUser returns error when not found', async () => {
      mockPrisma.read.user.findUnique.mockResolvedValue(null);
      const result = await (service as any).executeTool('update_user', { id: 'missing' });
      expect(result).toContain('Error');
      expect(result).toContain('not found');
    });

    it('deleteUser deletes and confirms', async () => {
      mockPrisma.write.user.findUnique.mockResolvedValue({ id: 'u1', firstName: 'Erki', lastName: 'K' });
      mockPrisma.write.user.delete.mockResolvedValue({});
      const result = await (service as any).executeTool('delete_user', { id: 'u1' });
      expect(result).toContain('deleted');
      expect(result).toContain('Erki K');
    });
  });

  describe('executeTool (private) — unknown', () => {
    it('returns unknown tool message', async () => {
      const result = await (service as any).executeTool('nonexistent_tool', {});
      expect(result).toContain('Unknown tool');
    });
  });

  describe('stream', () => {
    const makeOllamaResponse = (message: any) =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ message }) } as Response);

    it('responds with text when no tool calls', async () => {
      const res = mockResponse();
      global.fetch = jest.fn().mockImplementation(() => makeOllamaResponse({ content: 'Tere!' }));

      await service.stream({ messages: [{ role: 'user', content: 'Tere' }] }, res);

      expect(res.write).toHaveBeenCalledWith('Tere!');
      expect(res.end).toHaveBeenCalled();
    });

    it('returns 503 when Ollama is unavailable', async () => {
      const res = mockResponse();
      global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      await service.stream({ messages: [{ role: 'user', content: 'Tere' }] }, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ error: 'AI service unavailable' });
    });

    it('returns 503 when Ollama returns error status', async () => {
      const res = mockResponse();
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal error'),
      } as Response);

      await service.stream({ messages: [{ role: 'user', content: 'Tere' }] }, res);

      expect(res.status).toHaveBeenCalledWith(503);
    });

    it('filters out system messages from dto', async () => {
      const res = mockResponse();
      global.fetch = jest.fn().mockImplementation(() =>
        makeOllamaResponse({ content: 'ok' }),
      );

      await service.stream({
        messages: [
          { role: 'system', content: 'system prompt' },
          { role: 'user', content: 'Tere' },
        ],
      }, res);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      const nonSystemMessages = body.messages.filter((m: any) => m.role !== 'system');
      expect(nonSystemMessages.some((m: any) => m.content === 'system prompt')).toBe(false);
    });

    it('handles tool calls and sends result back to Ollama', async () => {
      const res = mockResponse();
      mockPrisma.read.note.count.mockResolvedValue(3);

      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return makeOllamaResponse({
            content: '',
            tool_calls: [{ function: { name: 'count_notes', arguments: {} } }],
          });
        }
        return makeOllamaResponse({ content: 'On 3 märget.' });
      });

      await service.stream({ messages: [{ role: 'user', content: 'Mitu märget on?' }] }, res);

      expect(callCount).toBe(2);
      expect(res.write).toHaveBeenCalledWith('On 3 märget.');
    });
  });
});
