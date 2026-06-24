import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FilesService } from './files.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { MessagingService } from '../messaging/messaging.service';

const mockPrisma = {
  read: {
    noteFile: { findUnique: jest.fn(), findMany: jest.fn() },
  },
  write: {
    noteFile: { create: jest.fn(), delete: jest.fn() },
  },
};

const mockStorage = {
  upload: jest.fn(),
  delete: jest.fn(),
  presignedGet: jest.fn(),
};

const mockMessaging = { publish: jest.fn() };

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorage },
        { provide: MessagingService, useValue: mockMessaging },
      ],
    }).compile();
    service = module.get<FilesService>(FilesService);
  });

  describe('upload', () => {
    const file: Express.Multer.File = {
      originalname: 'dokument.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('pdf-content'),
    } as Express.Multer.File;

    it('uploads file to storage and creates DB record', async () => {
      const record = { id: 10, noteId: 1, filename: 'dokument.pdf', key: 'notes/1/uuid.pdf', size: 1024, mimeType: 'application/pdf' };
      mockStorage.upload.mockResolvedValue(undefined);
      mockPrisma.write.noteFile.create.mockResolvedValue(record);

      const result = await service.upload(1, file);

      expect(mockStorage.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^notes\/1\/.+\.pdf$/),
        file.buffer,
        file.mimetype,
      );
      expect(mockPrisma.write.noteFile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            noteId: 1,
            filename: 'dokument.pdf',
            size: 1024,
            mimeType: 'application/pdf',
          }),
        }),
      );
      expect(mockMessaging.publish).toHaveBeenCalledWith('notes:changed');
      expect(result).toEqual(record);
    });

    it('uses extension from original filename', async () => {
      mockStorage.upload.mockResolvedValue(undefined);
      mockPrisma.write.noteFile.create.mockResolvedValue({});

      await service.upload(5, file);

      expect(mockStorage.upload).toHaveBeenCalledWith(
        expect.stringMatching(/\.pdf$/),
        expect.any(Buffer),
        expect.any(String),
      );
    });

    it('handles file without extension', async () => {
      const fileNoExt = { ...file, originalname: 'dokument' } as Express.Multer.File;
      mockStorage.upload.mockResolvedValue(undefined);
      mockPrisma.write.noteFile.create.mockResolvedValue({});

      await service.upload(1, fileNoExt);

      expect(mockStorage.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^notes\/1\/[^.]+$/),
        expect.any(Buffer),
        expect.any(String),
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when file not found', async () => {
      mockPrisma.read.noteFile.findUnique.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('deletes from storage and DB, then publishes', async () => {
      const dbFile = { id: 1, key: 'notes/1/file.pdf' };
      mockPrisma.read.noteFile.findUnique.mockResolvedValue(dbFile);
      mockStorage.delete.mockResolvedValue(undefined);
      mockPrisma.write.noteFile.delete.mockResolvedValue({});

      await service.remove(1);

      expect(mockStorage.delete).toHaveBeenCalledWith('notes/1/file.pdf');
      expect(mockPrisma.write.noteFile.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockMessaging.publish).toHaveBeenCalledWith('notes:changed');
    });
  });

  describe('removeAllForNote', () => {
    it('does nothing when note has no files', async () => {
      mockPrisma.read.noteFile.findMany.mockResolvedValue([]);

      await service.removeAllForNote(1);

      expect(mockStorage.delete).not.toHaveBeenCalled();
    });

    it('deletes all files from storage', async () => {
      const files = [
        { id: 1, key: 'notes/1/a.pdf' },
        { id: 2, key: 'notes/1/b.jpg' },
      ];
      mockPrisma.read.noteFile.findMany.mockResolvedValue(files);
      mockStorage.delete.mockResolvedValue(undefined);

      await service.removeAllForNote(1);

      expect(mockStorage.delete).toHaveBeenCalledTimes(2);
      expect(mockStorage.delete).toHaveBeenCalledWith('notes/1/a.pdf');
      expect(mockStorage.delete).toHaveBeenCalledWith('notes/1/b.jpg');
    });
  });

  describe('withUrls', () => {
    it('returns empty array for empty input', async () => {
      const result = await service.withUrls([]);
      expect(result).toEqual([]);
    });

    it('adds presigned url to each file', async () => {
      const files = [
        { id: 1, filename: 'a.pdf', key: 'notes/1/a.pdf', size: 100, mimeType: 'application/pdf', createdAt: new Date() },
        { id: 2, filename: 'b.jpg', key: 'notes/1/b.jpg', size: 200, mimeType: 'image/jpeg', createdAt: new Date() },
      ];
      mockStorage.presignedGet.mockImplementation((key: string) => Promise.resolve(`https://storage/${key}?sig=abc`));

      const result = await service.withUrls(files);

      expect(result).toHaveLength(2);
      expect(result[0].url).toBe('https://storage/notes/1/a.pdf?sig=abc');
      expect(result[1].url).toBe('https://storage/notes/1/b.jpg?sig=abc');
    });
  });
});
