import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  read: {
    client: { findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn() },
  },
  write: {
    client: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  },
};

describe('ClientsService', () => {
  let service: ClientsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ClientsService>(ClientsService);
  });

  describe('findAll', () => {
    it('returns clients ordered by name', async () => {
      const clients = [
        { id: '1', name: 'Acme OÜ', regCode: '12345678', createdAt: new Date() },
        { id: '2', name: 'Beta AS', regCode: null, createdAt: new Date() },
      ];
      mockPrisma.read.client.findMany.mockResolvedValue(clients);

      const result = await service.findAll();

      expect(result).toEqual(clients);
      expect(mockPrisma.read.client.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
        select: expect.any(Object),
      });
    });

    it('returns empty array when no clients', async () => {
      mockPrisma.read.client.findMany.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when client not found', async () => {
      mockPrisma.read.client.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns client with users when found', async () => {
      const client = {
        id: '1',
        name: 'Acme OÜ',
        regCode: '12345678',
        createdAt: new Date(),
        users: [{ id: 'u1', firstName: 'Erki', lastName: 'K', email: 'e@test.ee' }],
      };
      mockPrisma.read.client.findUnique.mockResolvedValue(client);

      const result = await service.findOne('1');

      expect(result).toEqual(client);
      expect(mockPrisma.read.client.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: expect.objectContaining({ users: expect.any(Object) }),
      });
    });
  });

  describe('search', () => {
    it('returns empty array for empty query', async () => {
      const result = await service.search('');
      expect(result).toEqual([]);
      expect(mockPrisma.read.client.findMany).not.toHaveBeenCalled();
    });

    it('returns empty array for whitespace-only query', async () => {
      const result = await service.search('   ');
      expect(result).toEqual([]);
    });

    it('searches by name case-insensitively', async () => {
      const clients = [{ id: '1', name: 'Acme OÜ', regCode: null, createdAt: new Date() }];
      mockPrisma.read.client.findMany.mockResolvedValue(clients);

      const result = await service.search('acme');

      expect(result).toEqual(clients);
      expect(mockPrisma.read.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'acme', mode: 'insensitive' } },
              { regCode: { contains: 'acme', mode: 'insensitive' } },
            ],
          },
          take: 10,
        }),
      );
    });

    it('searches by regCode', async () => {
      const clients = [{ id: '1', name: 'Acme OÜ', regCode: '12345678', createdAt: new Date() }];
      mockPrisma.read.client.findMany.mockResolvedValue(clients);

      const result = await service.search('1234');

      expect(result).toEqual(clients);
    });
  });

  describe('create', () => {
    it('creates client with trimmed name', async () => {
      const created = { id: 'new', name: 'Acme OÜ', regCode: null, createdAt: new Date() };
      mockPrisma.write.client.create.mockResolvedValue(created);

      const result = await service.create({ name: '  Acme OÜ  ' });

      expect(result).toEqual(created);
      expect(mockPrisma.write.client.create).toHaveBeenCalledWith({
        data: { name: 'Acme OÜ', regCode: null, street: null, city: null, zip: null, country: null },
        select: expect.any(Object),
      });
    });

    it('creates client with regCode', async () => {
      const created = { id: 'new', name: 'Beta AS', regCode: '87654321', createdAt: new Date() };
      mockPrisma.write.client.create.mockResolvedValue(created);

      await service.create({ name: 'Beta AS', regCode: ' 87654321 ' });

      expect(mockPrisma.write.client.create).toHaveBeenCalledWith({
        data: { name: 'Beta AS', regCode: '87654321', street: null, city: null, zip: null, country: null },
        select: expect.any(Object),
      });
    });

    it('stores null when regCode is empty string', async () => {
      const created = { id: 'new', name: 'Gamma OÜ', regCode: null, createdAt: new Date() };
      mockPrisma.write.client.create.mockResolvedValue(created);

      await service.create({ name: 'Gamma OÜ', regCode: '' });

      expect(mockPrisma.write.client.create).toHaveBeenCalledWith({
        data: { name: 'Gamma OÜ', regCode: null, street: null, city: null, zip: null, country: null },
        select: expect.any(Object),
      });
    });
  });

  describe('update', () => {
    it('throws NotFoundException when client not found', async () => {
      mockPrisma.write.client.findUnique.mockResolvedValue(null);
      await expect(service.update('missing', { name: 'Uus' })).rejects.toThrow(NotFoundException);
    });

    it('updates name', async () => {
      mockPrisma.write.client.findUnique.mockResolvedValue({ id: '1', name: 'Vana', regCode: null });
      const updated = { id: '1', name: 'Uus Nimi', regCode: null, createdAt: new Date() };
      mockPrisma.write.client.update.mockResolvedValue(updated);

      const result = await service.update('1', { name: 'Uus Nimi' });

      expect(result).toEqual(updated);
      expect(mockPrisma.write.client.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Uus Nimi' },
        select: expect.any(Object),
      });
    });

    it('clears regCode when empty string provided', async () => {
      mockPrisma.write.client.findUnique.mockResolvedValue({ id: '1', name: 'Acme', regCode: '12345678' });
      mockPrisma.write.client.update.mockResolvedValue({ id: '1', name: 'Acme', regCode: null, createdAt: new Date() });

      await service.update('1', { regCode: '' });

      expect(mockPrisma.write.client.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ regCode: null }),
        }),
      );
    });

    it('updates regCode when non-empty', async () => {
      mockPrisma.write.client.findUnique.mockResolvedValue({ id: '1', name: 'Acme', regCode: null });
      mockPrisma.write.client.update.mockResolvedValue({ id: '1', name: 'Acme', regCode: '99999999', createdAt: new Date() });

      await service.update('1', { regCode: '99999999' });

      expect(mockPrisma.write.client.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ regCode: '99999999' }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when client not found', async () => {
      mockPrisma.write.client.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });

    it('deletes client when found', async () => {
      mockPrisma.write.client.findUnique.mockResolvedValue({ id: '1', name: 'Acme OÜ' });
      mockPrisma.write.client.delete.mockResolvedValue({});

      await service.remove('1');

      expect(mockPrisma.write.client.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
