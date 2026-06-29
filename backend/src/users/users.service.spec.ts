import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

jest.mock('../auth/better-auth', () => ({
  hashPassword: (pw: string) => `hashed:${pw}`,
  verifyPassword: jest.fn().mockReturnValue(true),
  auth: { api: { getSession: jest.fn() } },
}));

import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

const mockPrisma = {
  read: {
    user: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  },
  write: {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    account: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
    verification: { findFirst: jest.fn(), create: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
  },
};

const mockMail = {
  sendWelcome: jest.fn(),
  sendEmailVerification: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMail },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('returns users list', async () => {
      const users = [{ id: '1', firstName: 'Erki', lastName: 'K', email: 'e@test.ee', createdAt: new Date() }];
      mockPrisma.read.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockPrisma.read.user.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when user not found', async () => {
      mockPrisma.read.user.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('returns user with parsed chatInputHistory', async () => {
      mockPrisma.read.user.findUnique.mockResolvedValue({
        id: '1', firstName: 'Erki', lastName: 'K', email: 'e@test.ee', createdAt: new Date(),
        chatInputHistory: JSON.stringify(['käsk 1', 'käsk 2']),
      });

      const result = await service.findOne('1');

      expect(result.chatInputHistory).toEqual(['käsk 1', 'käsk 2']);
    });

    it('returns empty chatInputHistory when null', async () => {
      mockPrisma.read.user.findUnique.mockResolvedValue({
        id: '1', firstName: 'Erki', lastName: 'K', email: 'e@test.ee', createdAt: new Date(),
        chatInputHistory: null,
      });

      const result = await service.findOne('1');

      expect(result.chatInputHistory).toEqual([]);
    });
  });

  describe('create', () => {
    const userData = { firstName: 'Erki', lastName: 'K', email: 'erki@test.ee', password: 'parool123' };

    it('throws ConflictException when email already exists', async () => {
      mockPrisma.write.user.findUnique.mockResolvedValue({ id: 'existing' });
      mockPrisma.read.user.count.mockResolvedValue(1);

      await expect(service.create(userData)).rejects.toThrow(ConflictException);
    });

    it('creates user with USER role when other users exist', async () => {
      const created = { id: 'new-id', firstName: 'Erki', lastName: 'K', email: 'erki@test.ee', createdAt: new Date() };
      mockPrisma.write.user.findUnique.mockResolvedValue(null);
      mockPrisma.read.user.count.mockResolvedValue(3);
      mockPrisma.write.user.create.mockResolvedValue(created);
      mockMail.sendWelcome.mockResolvedValue(undefined);

      const result = await service.create(userData);

      expect(result).toEqual(created);
      expect(mockPrisma.write.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: 'Erki',
            lastName: 'K',
            email: 'erki@test.ee',
            name: 'Erki K',
            emailVerified: true,
            roles: ['USER'],
          }),
        }),
      );
    });

    it('creates first user with GLOBAL_ADMIN role regardless of requested roles', async () => {
      const created = { id: 'first-id', firstName: 'Erki', lastName: 'K', email: 'erki@test.ee', createdAt: new Date() };
      mockPrisma.write.user.findUnique.mockResolvedValue(null);
      mockPrisma.read.user.count.mockResolvedValue(0);
      mockPrisma.write.user.create.mockResolvedValue(created);
      mockMail.sendWelcome.mockResolvedValue(undefined);

      await service.create({ ...userData, roles: ['USER'] });

      expect(mockPrisma.write.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ roles: ['GLOBAL_ADMIN'] }),
        }),
      );
    });
  });

  describe('getRoles', () => {
    it('returns roles when user exists', async () => {
      mockPrisma.read.user.findUnique.mockResolvedValue({ roles: ['GLOBAL_ADMIN'] });

      const result = await service.getRoles('u1');

      expect(result).toEqual(['GLOBAL_ADMIN']);
      expect(mockPrisma.read.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' }, select: { roles: true } });
    });

    it('returns empty array when user not found', async () => {
      mockPrisma.read.user.findUnique.mockResolvedValue(null);

      const result = await service.getRoles('missing');

      expect(result).toEqual([]);
    });
  });

  describe('updateRoles', () => {
    it('throws ForbiddenException when trying to change own roles', async () => {
      await expect(service.updateRoles('u1', ['USER'], 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when user not found', async () => {
      mockPrisma.write.user.findUnique.mockResolvedValue(null);

      await expect(service.updateRoles('missing', ['USER'], 'requester')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when no valid roles provided', async () => {
      mockPrisma.write.user.findUnique.mockResolvedValue({ id: 'u1', roles: ['USER'] });

      await expect(service.updateRoles('u1', ['INVALID_ROLE'], 'requester')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when demoting last global admin', async () => {
      mockPrisma.write.user.findUnique.mockResolvedValue({ id: 'u1', roles: ['GLOBAL_ADMIN'] });
      mockPrisma.read.user.count.mockResolvedValue(1);

      await expect(service.updateRoles('u1', ['USER'], 'requester')).rejects.toThrow(ForbiddenException);
    });

    it('updates to GLOBAL_ADMIN without last-admin check', async () => {
      mockPrisma.write.user.findUnique.mockResolvedValue({ id: 'u1', roles: ['USER'] });
      mockPrisma.write.user.update.mockResolvedValue({ id: 'u1', roles: ['GLOBAL_ADMIN'] });

      await service.updateRoles('u1', ['GLOBAL_ADMIN'], 'requester');

      expect(mockPrisma.read.user.count).not.toHaveBeenCalled();
      expect(mockPrisma.write.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u1' }, data: { roles: ['GLOBAL_ADMIN'] } }),
      );
    });

    it('updates to USER when multiple global admins exist', async () => {
      mockPrisma.write.user.findUnique.mockResolvedValue({ id: 'u1', roles: ['GLOBAL_ADMIN'] });
      mockPrisma.read.user.count.mockResolvedValue(2);
      mockPrisma.write.user.update.mockResolvedValue({ id: 'u1', roles: ['USER'] });

      await service.updateRoles('u1', ['USER'], 'requester');

      expect(mockPrisma.write.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u1' }, data: { roles: ['USER'] } }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when user not found', async () => {
      mockPrisma.write.user.findUnique.mockResolvedValue(null);
      await expect(service.update('missing', { firstName: 'Uus' })).rejects.toThrow(NotFoundException);
    });

    it('updates firstName and lastName and rebuilds name', async () => {
      const existing = { id: '1', firstName: 'Vana', lastName: 'Perenimi', email: 'v@test.ee' };
      const updated = { id: '1', firstName: 'Uus', lastName: 'Perenimi', email: 'v@test.ee', createdAt: new Date() };
      mockPrisma.write.user.findUnique.mockResolvedValue(existing);
      mockPrisma.write.user.update.mockResolvedValue(updated);

      const result = await service.update('1', { firstName: 'Uus' });

      expect(mockPrisma.write.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({ firstName: 'Uus', name: 'Uus Perenimi' }),
        }),
      );
      expect(result).toEqual(updated);
    });

    it('updates password by updating existing credential account', async () => {
      const existing = { id: '1', firstName: 'Erki', lastName: 'K', email: 'e@test.ee' };
      const credAccount = { id: 'cred-1' };
      mockPrisma.write.user.findUnique.mockResolvedValue(existing);
      mockPrisma.write.user.update.mockResolvedValue({ ...existing, createdAt: new Date() });
      mockPrisma.write.account.findFirst.mockResolvedValue(credAccount);
      mockPrisma.write.account.update.mockResolvedValue({});

      await service.update('1', { password: 'uusParool' });

      expect(mockPrisma.write.account.update).toHaveBeenCalledWith({
        where: { id: 'cred-1' },
        data: { password: 'hashed:uusParool' },
      });
    });

    it('creates credential account when none exists and password provided', async () => {
      const existing = { id: '1', firstName: 'Erki', lastName: 'K', email: 'e@test.ee' };
      mockPrisma.write.user.findUnique.mockResolvedValue(existing);
      mockPrisma.write.user.update.mockResolvedValue({ ...existing, createdAt: new Date() });
      mockPrisma.write.account.findFirst.mockResolvedValue(null);
      mockPrisma.write.account.create.mockResolvedValue({});

      await service.update('1', { password: 'uusParool' });

      expect(mockPrisma.write.account.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ providerId: 'credential', password: 'hashed:uusParool' }),
        }),
      );
    });

    it('serializes chatInputHistory as JSON', async () => {
      const existing = { id: '1', firstName: 'Erki', lastName: 'K', email: 'e@test.ee' };
      mockPrisma.write.user.findUnique.mockResolvedValue(existing);
      mockPrisma.write.user.update.mockResolvedValue({ ...existing, createdAt: new Date() });

      await service.update('1', { chatInputHistory: ['käsk 1', 'käsk 2'] });

      expect(mockPrisma.write.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ chatInputHistory: '["käsk 1","käsk 2"]' }),
        }),
      );
    });

    it('sets clientId when provided', async () => {
      const existing = { id: '1', firstName: 'Erki', lastName: 'K', email: 'e@test.ee' };
      mockPrisma.write.user.findUnique.mockResolvedValue(existing);
      mockPrisma.write.user.update.mockResolvedValue({ ...existing, clientId: 'c-123', createdAt: new Date() });

      await service.update('1', { clientId: 'c-123' });

      expect(mockPrisma.write.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ clientId: 'c-123' }),
        }),
      );
    });

    it('clears clientId when null passed', async () => {
      const existing = { id: '1', firstName: 'Erki', lastName: 'K', email: 'e@test.ee' };
      mockPrisma.write.user.findUnique.mockResolvedValue(existing);
      mockPrisma.write.user.update.mockResolvedValue({ ...existing, clientId: null, createdAt: new Date() });

      await service.update('1', { clientId: null });

      expect(mockPrisma.write.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ clientId: null }),
        }),
      );
    });
  });

  describe('doVerifyEmail', () => {
    it('returns false when token not found', async () => {
      mockPrisma.write.verification.findFirst.mockResolvedValue(null);
      const result = await service.doVerifyEmail('invalid-token');
      expect(result).toBe(false);
    });

    it('returns false when token expired', async () => {
      const expired = { id: 'v1', identifier: 'e@test.ee', value: 'token', expiresAt: new Date(Date.now() - 1000) };
      mockPrisma.write.verification.findFirst.mockResolvedValue(expired);

      const result = await service.doVerifyEmail('token');

      expect(result).toBe(false);
    });

    it('verifies email and deletes token when valid', async () => {
      const valid = { id: 'v1', identifier: 'e@test.ee', value: 'token', expiresAt: new Date(Date.now() + 3600000) };
      mockPrisma.write.verification.findFirst.mockResolvedValue(valid);
      mockPrisma.write.user.update.mockResolvedValue({});
      mockPrisma.write.verification.delete.mockResolvedValue({});

      const result = await service.doVerifyEmail('token');

      expect(result).toBe(true);
      expect(mockPrisma.write.user.update).toHaveBeenCalledWith({
        where: { email: 'e@test.ee' },
        data: { emailVerified: true },
      });
      expect(mockPrisma.write.verification.delete).toHaveBeenCalledWith({ where: { id: 'v1' } });
    });
  });

  describe('resendVerification', () => {
    it('does nothing when user not found', async () => {
      mockPrisma.write.user.findUnique.mockResolvedValue(null);

      await service.resendVerification('ghost@test.ee');

      expect(mockPrisma.write.verification.create).not.toHaveBeenCalled();
    });

    it('does nothing when email already verified', async () => {
      mockPrisma.write.user.findUnique.mockResolvedValue({ id: '1', emailVerified: true });

      await service.resendVerification('e@test.ee');

      expect(mockPrisma.write.verification.create).not.toHaveBeenCalled();
    });

    it('creates verification token and sends email', async () => {
      mockPrisma.write.user.findUnique.mockResolvedValue({ id: '1', emailVerified: false });
      mockPrisma.write.verification.deleteMany.mockResolvedValue({});
      mockPrisma.write.verification.create.mockResolvedValue({});
      mockMail.sendEmailVerification.mockResolvedValue(undefined);

      await service.resendVerification('e@test.ee');

      expect(mockPrisma.write.verification.deleteMany).toHaveBeenCalledWith({ where: { identifier: 'e@test.ee' } });
      expect(mockPrisma.write.verification.create).toHaveBeenCalled();
      expect(mockMail.sendEmailVerification).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when user not found', async () => {
      mockPrisma.write.user.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });

    it('deletes user when found', async () => {
      mockPrisma.write.user.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.write.user.delete.mockResolvedValue({});

      await service.remove('1');

      expect(mockPrisma.write.user.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
