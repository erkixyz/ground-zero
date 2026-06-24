import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

jest.mock('../auth/better-auth', () => ({
  hashPassword: jest.fn(),
  auth: { api: { getSession: jest.fn() } },
}));

jest.mock('better-auth/node', () => ({
  fromNodeHeaders: jest.fn().mockReturnValue({}),
}));

import { auth } from '../auth/better-auth';

const mockUsersService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  doVerifyEmail: jest.fn(),
  resendVerification: jest.fn(),
};

const mockRes = () => {
  const res: any = {};
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();
    controller = module.get<UsersController>(UsersController);
  });

  describe('findAll', () => {
    it('delegates to service.findAll', () => {
      mockUsersService.findAll.mockResolvedValue([]);
      controller.findAll();
      expect(mockUsersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('delegates to service.findOne', () => {
      mockUsersService.findOne.mockResolvedValue({ id: '1' });
      controller.findOne('1');
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    it('trims and lowercases input before service call', async () => {
      mockUsersService.create.mockResolvedValue({ id: 'new' });
      const dto = { firstName: ' Erki ', lastName: ' K ', email: ' ERKI@TEST.EE ', password: 'parool' };

      await controller.create(dto);

      expect(mockUsersService.create).toHaveBeenCalledWith({
        firstName: 'Erki',
        lastName: 'K',
        email: 'erki@test.ee',
        password: 'parool',
      });
    });
  });

  describe('update', () => {
    it('trims optional fields and passes to service', async () => {
      mockUsersService.update.mockResolvedValue({ id: '1' });
      const dto = { firstName: ' Uus ', email: ' UUS@TEST.EE ' };

      await controller.update('1', dto as any);

      expect(mockUsersService.update).toHaveBeenCalledWith('1', {
        firstName: 'Uus',
        lastName: undefined,
        email: 'uus@test.ee',
        password: undefined,
        chatInputHistory: undefined,
      });
    });
  });

  describe('remove', () => {
    it('throws ForbiddenException when deleting self', async () => {
      (auth.api.getSession as unknown as jest.Mock).mockResolvedValue({ user: { id: 'me' } });
      const req = { headers: {} } as any;

      await expect(controller.remove('me', req)).rejects.toThrow(ForbiddenException);
    });

    it('delegates to service when deleting other user', async () => {
      (auth.api.getSession as unknown as jest.Mock).mockResolvedValue({ user: { id: 'me' } });
      mockUsersService.remove.mockResolvedValue(undefined);
      const req = { headers: {} } as any;

      await controller.remove('other-user', req);

      expect(mockUsersService.remove).toHaveBeenCalledWith('other-user');
    });

    it('deletes when not authenticated', async () => {
      (auth.api.getSession as unknown as jest.Mock).mockResolvedValue(null);
      mockUsersService.remove.mockResolvedValue(undefined);
      const req = { headers: {} } as any;

      await controller.remove('some-user', req);

      expect(mockUsersService.remove).toHaveBeenCalledWith('some-user');
    });
  });

  describe('verifyEmail', () => {
    it('redirects to callbackURL with success when token valid', async () => {
      mockUsersService.doVerifyEmail.mockResolvedValue(true);
      const res = mockRes();

      await controller.verifyEmail('valid-token', 'http://localhost:3000/verify-email?verified=true', res);

      expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/verify-email?verified=true');
    });

    it('redirects with error param when token invalid', async () => {
      mockUsersService.doVerifyEmail.mockResolvedValue(false);
      const res = mockRes();

      await controller.verifyEmail('bad-token', 'http://localhost:3000/verify', res);

      expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/verify?error=INVALID_TOKEN');
    });

    it('handles callbackURL with existing query params', async () => {
      mockUsersService.doVerifyEmail.mockResolvedValue(false);
      const res = mockRes();

      await controller.verifyEmail('bad', 'http://localhost:3000/verify?verified=true', res);

      expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/verify?verified=true&error=INVALID_TOKEN');
    });
  });

  describe('resendVerification', () => {
    it('calls service and returns ok', async () => {
      mockUsersService.resendVerification.mockResolvedValue(undefined);

      const result = await controller.resendVerification({ email: 'e@test.ee' });

      expect(mockUsersService.resendVerification).toHaveBeenCalledWith('e@test.ee');
      expect(result).toEqual({ ok: true });
    });
  });
});
