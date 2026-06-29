import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  read: {
    note: { findMany: jest.fn() },
    user: { findMany: jest.fn() },
    client: { findMany: jest.fn() },
    organisation: { findMany: jest.fn() },
  },
};

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<SearchService>(SearchService);
  });

  describe('search', () => {
    it('returns empty results for blank query', async () => {
      const result = await service.search('');
      expect(result).toEqual({ notes: [], users: [], clients: [], organisations: [] });
      expect(mockPrisma.read.note.findMany).not.toHaveBeenCalled();
    });

    it('returns empty results for whitespace-only query', async () => {
      const result = await service.search('   ');
      expect(result).toEqual({ notes: [], users: [], clients: [], organisations: [] });
    });

    it('searches notes, users, clients and organisations in parallel', async () => {
      const notes = [{ id: 1, title: 'Märge', content: 'Sisu', category: null, createdAt: new Date() }];
      const users = [{ id: 'u1', firstName: 'Erki', lastName: 'K', email: 'erki@test.ee' }];
      const clients = [{ id: 'c1', name: 'Acme OÜ', regCode: '12345678' }];
      const organisations = [{ id: 'o1', name: 'Org OÜ', regCode: '87654321' }];
      mockPrisma.read.note.findMany.mockResolvedValue(notes);
      mockPrisma.read.user.findMany.mockResolvedValue(users);
      mockPrisma.read.client.findMany.mockResolvedValue(clients);
      mockPrisma.read.organisation.findMany.mockResolvedValue(organisations);

      const result = await service.search('erki');

      expect(result.notes).toEqual(notes);
      expect(result.users).toEqual(users);
      expect(result.clients).toEqual(clients);
      expect(result.organisations).toEqual(organisations);
    });

    it('passes correct query to client search', async () => {
      mockPrisma.read.note.findMany.mockResolvedValue([]);
      mockPrisma.read.user.findMany.mockResolvedValue([]);
      mockPrisma.read.client.findMany.mockResolvedValue([]);
      mockPrisma.read.organisation.findMany.mockResolvedValue([]);

      await service.search('acme');

      expect(mockPrisma.read.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'acme', mode: 'insensitive' } },
              { regCode: { contains: 'acme', mode: 'insensitive' } },
            ],
          },
          take: 5,
        }),
      );
    });

    it('passes correct query to note search', async () => {
      mockPrisma.read.note.findMany.mockResolvedValue([]);
      mockPrisma.read.user.findMany.mockResolvedValue([]);
      mockPrisma.read.client.findMany.mockResolvedValue([]);
      mockPrisma.read.organisation.findMany.mockResolvedValue([]);

      await service.search('otsing');

      expect(mockPrisma.read.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { title: { contains: 'otsing', mode: 'insensitive' } },
              { content: { contains: 'otsing', mode: 'insensitive' } },
            ],
          },
          take: 5,
        }),
      );
    });

    it('passes correct query to user search', async () => {
      mockPrisma.read.note.findMany.mockResolvedValue([]);
      mockPrisma.read.user.findMany.mockResolvedValue([]);
      mockPrisma.read.client.findMany.mockResolvedValue([]);
      mockPrisma.read.organisation.findMany.mockResolvedValue([]);

      await service.search('otsing');

      expect(mockPrisma.read.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { firstName: { contains: 'otsing', mode: 'insensitive' } },
              { lastName: { contains: 'otsing', mode: 'insensitive' } },
              { email: { contains: 'otsing', mode: 'insensitive' } },
            ],
          },
          take: 5,
        }),
      );
    });

    it('trims whitespace from query', async () => {
      mockPrisma.read.note.findMany.mockResolvedValue([]);
      mockPrisma.read.user.findMany.mockResolvedValue([]);
      mockPrisma.read.client.findMany.mockResolvedValue([]);
      mockPrisma.read.organisation.findMany.mockResolvedValue([]);

      await service.search('  otsing  ');

      expect(mockPrisma.read.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'otsing', mode: 'insensitive' } },
              { content: { contains: 'otsing', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });
});
