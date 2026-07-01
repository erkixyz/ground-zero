import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

jest.mock('../auth/better-auth', () => ({
  hashPassword: jest.fn(),
  auth: { api: { getSession: jest.fn() } },
}));

jest.mock('better-auth/node', () => ({
  fromNodeHeaders: jest.fn().mockReturnValue({}),
}));

const mockUsersService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getRoles: jest.fn(),
  updateRoles: jest.fn(),
  doVerifyEmail: jest.fn(),
  resendVerification: jest.fn(),
};

const mockRes = () => {
  const res: any = {};
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

const globalAdmin = { id: 'admin', firstName: 'Admin', lastName: 'User', email: 'admin@test.ee', roles: ['GLOBAL_ADMIN'] };
const regularUser = { id: 'u2', firstName: 'Regular', lastName: 'User', email: 'u2@test.ee', roles: ['USER'] };

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
      const dto = { firstName: ' Erki ', lastName: ' K ', email: ' ERKI@TEST.EE ', password: 'parool', roles: undefined };

      await controller.create(dto as any);

      expect(mockUsersService.create).toHaveBeenCalledWith({
        firstName: 'Erki',
        lastName: 'K',
        email: 'erki@test.ee',
        password: 'parool',
        roles: undefined,
      });
    });

    it('passes roles array to service', async () => {
      mockUsersService.create.mockResolvedValue({ id: 'new' });
      const dto = { firstName: 'Erki', lastName: 'K', email: 'e@test.ee', password: 'parool', roles: ['NOTES_ADMIN', 'USER'] };

      await controller.create(dto as any);

      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ roles: ['NOTES_ADMIN', 'USER'] }),
      );
    });
  });

  describe('updateRoles', () => {
    it('delegates to service.updateRoles with currentUser id', async () => {
      mockUsersService.updateRoles.mockResolvedValue({ id: 'u1', roles: ['NOTES_ADMIN'] });

      await controller.updateRoles('u1', { roles: ['NOTES_ADMIN'] }, globalAdmin as any);

      expect(mockUsersService.updateRoles).toHaveBeenCalledWith('u1', ['NOTES_ADMIN'], 'admin');
    });

    it('passes empty array when body has no roles', async () => {
      mockUsersService.updateRoles.mockResolvedValue({ id: 'u1', roles: ['USER'] });

      await controller.updateRoles('u1', {} as any, globalAdmin as any);

      expect(mockUsersService.updateRoles).toHaveBeenCalledWith('u1', [], 'admin');
    });
  });

  describe('update', () => {
    it('allows own profile update', async () => {
      mockUsersService.update.mockResolvedValue({ id: 'u2' });
      const dto = { firstName: 'Uus', email: 'uus@test.ee' };

      await controller.update('u2', dto as any, regularUser as any);

      expect(mockUsersService.update).toHaveBeenCalledWith('u2', expect.objectContaining({ firstName: 'Uus' }));
    });

    it('allows global admin to update any user', async () => {
      mockUsersService.update.mockResolvedValue({ id: 'u2' });
      const dto = { firstName: 'Uus' };

      await controller.update('u2', dto as any, globalAdmin as any);

      expect(mockUsersService.update).toHaveBeenCalled();
    });

    it('throws when non-admin tries to update another user', async () => {
      const dto = { firstName: 'Uus' };

      await expect(controller.update('other-user', dto as any, regularUser as any)).rejects.toThrow();

      expect(mockUsersService.update).not.toHaveBeenCalled();
    });

    it('trims optional fields and passes to service', async () => {
      mockUsersService.update.mockResolvedValue({ id: 'u2' });
      const dto = { firstName: ' Uus ', email: ' UUS@TEST.EE ' };

      await controller.update('u2', dto as any, regularUser as any);

      expect(mockUsersService.update).toHaveBeenCalledWith('u2', expect.objectContaining({
        firstName: 'Uus',
        email: 'uus@test.ee',
      }));
    });

    it('passes organisationId to service when provided', async () => {
      mockUsersService.update.mockResolvedValue({ id: 'u2' });
      const dto = { firstName: 'Uus', lastName: 'K', email: 'e@test.ee', organisationId: 'o-123' };

      await controller.update('u2', dto as any, regularUser as any);

      expect(mockUsersService.update).toHaveBeenCalledWith('u2', expect.objectContaining({ organisationId: 'o-123' }));
    });
  });

  describe('remove', () => {
    it('throws when deleting self', async () => {
      await expect(controller.remove('admin', globalAdmin as any)).rejects.toThrow();

      expect(mockUsersService.remove).not.toHaveBeenCalled();
    });

    it('delegates to service when deleting other user', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove('u2', globalAdmin as any);

      expect(mockUsersService.remove).toHaveBeenCalledWith('u2');
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
