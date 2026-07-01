import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrganisationsService } from './organisations.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  read: {
    organisation: { findMany: jest.fn(), findUnique: jest.fn() },
  },
  write: {
    organisation: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  },
};

describe('OrganisationsService', () => {
  let service: OrganisationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganisationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<OrganisationsService>(OrganisationsService);
  });

  describe('findAll', () => {
    it('returns organisations ordered by name', async () => {
      const orgs = [
        { id: '1', name: 'Acme OÜ', regCode: '12345678', createdAt: new Date() },
        { id: '2', name: 'Beta AS', regCode: null, createdAt: new Date() },
      ];
      mockPrisma.read.organisation.findMany.mockResolvedValue(orgs);

      const result = await service.findAll();

      expect(result).toEqual(orgs);
      expect(mockPrisma.read.organisation.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
        select: expect.any(Object),
      });
    });

    it('returns empty array when no organisations', async () => {
      mockPrisma.read.organisation.findMany.mockResolvedValue([]);
      expect(await service.findAll()).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when not found', async () => {
      mockPrisma.read.organisation.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns organisation with linked users when found', async () => {
      const org = {
        id: '1',
        name: 'Acme OÜ',
        regCode: '12345678',
        createdAt: new Date(),
        users: [{ id: 'u1', firstName: 'Erki', lastName: 'K', email: 'e@test.ee' }],
      };
      mockPrisma.read.organisation.findUnique.mockResolvedValue(org);

      const result = await service.findOne('1');

      expect(result).toEqual(org);
      expect(mockPrisma.read.organisation.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: expect.objectContaining({ users: expect.any(Object) }),
      });
    });
  });

  describe('search', () => {
    it('returns empty array for empty query', async () => {
      expect(await service.search('')).toEqual([]);
      expect(mockPrisma.read.organisation.findMany).not.toHaveBeenCalled();
    });

    it('searches by name and regCode case-insensitively', async () => {
      const orgs = [{ id: '1', name: 'Acme OÜ', regCode: null, createdAt: new Date() }];
      mockPrisma.read.organisation.findMany.mockResolvedValue(orgs);

      await service.search('acme');

      expect(mockPrisma.read.organisation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { OR: [
            { name: { contains: 'acme', mode: 'insensitive' } },
            { regCode: { contains: 'acme', mode: 'insensitive' } },
          ]},
          take: 10,
        }),
      );
    });
  });

  describe('create', () => {
    it('creates organisation with trimmed name and null optional fields', async () => {
      const created = { id: 'new', name: 'Acme OÜ', regCode: null, createdAt: new Date() };
      mockPrisma.write.organisation.create.mockResolvedValue(created);

      const result = await service.create({ name: '  Acme OÜ  ' });

      expect(result).toEqual(created);
      expect(mockPrisma.write.organisation.create).toHaveBeenCalledWith({
        data: { name: 'Acme OÜ', regCode: null, street: null, city: null, zip: null, country: null },
        select: expect.any(Object),
      });
    });

    it('trims and stores regCode', async () => {
      mockPrisma.write.organisation.create.mockResolvedValue({});
      await service.create({ name: 'Beta AS', regCode: ' 87654321 ' });
      expect(mockPrisma.write.organisation.create).toHaveBeenCalledWith({
        data: { name: 'Beta AS', regCode: '87654321', street: null, city: null, zip: null, country: null },
        select: expect.any(Object),
      });
    });
  });

  describe('update', () => {
    it('throws NotFoundException when not found', async () => {
      mockPrisma.write.organisation.findUnique.mockResolvedValue(null);
      await expect(service.update('missing', { name: 'Uus' })).rejects.toThrow(NotFoundException);
    });

    it('updates name', async () => {
      mockPrisma.write.organisation.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.write.organisation.update.mockResolvedValue({ id: '1', name: 'Uus Nimi' });

      await service.update('1', { name: 'Uus Nimi' });

      expect(mockPrisma.write.organisation.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Uus Nimi' },
        select: expect.any(Object),
      });
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when not found', async () => {
      mockPrisma.write.organisation.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });

    it('deletes organisation', async () => {
      mockPrisma.write.organisation.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.write.organisation.delete.mockResolvedValue({});

      await service.remove('1');

      expect(mockPrisma.write.organisation.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
