import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { MessagingService } from '../messaging/messaging.service';
import { StorageService } from '../storage/storage.service';
import { MailService } from '../mail/mail.service';

const mockPrisma = {
  read: {
    note: { findMany: jest.fn(), findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
  },
  write: {
    note: { create: jest.fn(), delete: jest.fn() },
  },
};

const mockFiles = {
  withUrls: jest.fn(),
  removeAllForNote: jest.fn(),
};

const mockMessaging = { publish: jest.fn() };
const mockStorage = { getObject: jest.fn() };
const mockMail = { sendNoteCreated: jest.fn(), sendNote: jest.fn() };

describe('NotesService', () => {
  let service: NotesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FilesService, useValue: mockFiles },
        { provide: MessagingService, useValue: mockMessaging },
        { provide: StorageService, useValue: mockStorage },
        { provide: MailService, useValue: mockMail },
      ],
    }).compile();
    service = module.get<NotesService>(NotesService);
  });

  describe('findAll', () => {
    it('returns notes mapped with file urls', async () => {
      const note = { id: 1, title: 'Märge', content: 'Sisu', files: [], author: null };
      mockPrisma.read.note.findMany.mockResolvedValue([note]);
      mockFiles.withUrls.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(mockPrisma.read.note.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: { files: true, author: { select: { firstName: true, lastName: true } } },
      });
      expect(mockFiles.withUrls).toHaveBeenCalledWith([]);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when note not found', async () => {
      mockPrisma.read.note.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('returns note with file urls when found', async () => {
      const note = { id: 1, title: 'Test', content: 'Body', files: [], author: null };
      mockPrisma.read.note.findUnique.mockResolvedValue(note);
      mockFiles.withUrls.mockResolvedValue([]);

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
      expect(mockFiles.withUrls).toHaveBeenCalledWith([]);
    });
  });

  describe('create', () => {
    const createdNote = { id: 42, title: 'Uus', content: 'Sisu', category: null, pinned: false };

    it('creates note without authorId', async () => {
      mockPrisma.write.note.create.mockResolvedValue(createdNote);

      const result = await service.create('Uus', 'Sisu');

      expect(mockPrisma.write.note.create).toHaveBeenCalledWith({
        data: { title: 'Uus', content: 'Sisu', category: null, pinned: false, authorId: null },
      });
      expect(mockMessaging.publish).toHaveBeenCalledWith('notes:changed');
      expect(result).toEqual(createdNote);
    });

    it('creates note with category and pinned', async () => {
      mockPrisma.write.note.create.mockResolvedValue({ ...createdNote, category: 'too', pinned: true });

      await service.create('Uus', 'Sisu', 'too', true);

      expect(mockPrisma.write.note.create).toHaveBeenCalledWith({
        data: { title: 'Uus', content: 'Sisu', category: 'too', pinned: true, authorId: null },
      });
    });

    it('fetches author and sends email when authorId provided', async () => {
      const author = { email: 'autor@test.ee', firstName: 'Erki' };
      mockPrisma.write.note.create.mockResolvedValue(createdNote);
      mockPrisma.read.user.findUnique.mockResolvedValue(author);
      mockMail.sendNoteCreated.mockResolvedValue(undefined);

      await service.create('Uus', 'Sisu', undefined, undefined, 'user-1');

      expect(mockPrisma.read.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { email: true, firstName: true },
      });
    });

    it('skips email when author not found', async () => {
      mockPrisma.write.note.create.mockResolvedValue(createdNote);
      mockPrisma.read.user.findUnique.mockResolvedValue(null);

      await service.create('Uus', 'Sisu', undefined, undefined, 'user-xyz');

      expect(mockMail.sendNoteCreated).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('removes files, deletes note and publishes event', async () => {
      mockFiles.removeAllForNote.mockResolvedValue(undefined);
      mockPrisma.write.note.delete.mockResolvedValue({});

      await service.remove(5);

      expect(mockFiles.removeAllForNote).toHaveBeenCalledWith(5);
      expect(mockPrisma.write.note.delete).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(mockMessaging.publish).toHaveBeenCalledWith('notes:changed');
    });
  });

  describe('sendByEmail', () => {
    it('throws NotFoundException when note not found', async () => {
      mockPrisma.read.note.findUnique.mockResolvedValue(null);
      await expect(service.sendByEmail(999, 'test@test.ee')).rejects.toThrow(NotFoundException);
    });

    it('sends note with file attachments', async () => {
      const file = { filename: 'doc.pdf', key: 'notes/1/doc.pdf', mimeType: 'application/pdf' };
      const note = { id: 1, title: 'Test', content: 'Body', category: null, files: [file], author: null };
      const buf = Buffer.from('pdf-content');
      mockPrisma.read.note.findUnique.mockResolvedValue(note);
      mockStorage.getObject.mockResolvedValue(buf);
      mockMail.sendNote.mockResolvedValue(undefined);

      await service.sendByEmail(1, 'saaja@test.ee');

      expect(mockStorage.getObject).toHaveBeenCalledWith('notes/1/doc.pdf');
      expect(mockMail.sendNote).toHaveBeenCalledWith(
        'saaja@test.ee',
        note,
        [{ filename: 'doc.pdf', content: buf, contentType: 'application/pdf' }],
      );
    });

    it('sends note without attachments when no files', async () => {
      const note = { id: 2, title: 'Simple', content: 'Body', category: null, files: [], author: null };
      mockPrisma.read.note.findUnique.mockResolvedValue(note);
      mockMail.sendNote.mockResolvedValue(undefined);

      await service.sendByEmail(2, 'saaja@test.ee');

      expect(mockStorage.getObject).not.toHaveBeenCalled();
      expect(mockMail.sendNote).toHaveBeenCalledWith('saaja@test.ee', note, []);
    });
  });
});
