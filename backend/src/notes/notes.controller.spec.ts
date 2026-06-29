import { Test, TestingModule } from '@nestjs/testing';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

jest.mock('../auth/better-auth', () => ({
  hashPassword: jest.fn(),
  auth: { api: { getSession: jest.fn() } },
}));

jest.mock('better-auth/node', () => ({
  fromNodeHeaders: jest.fn().mockReturnValue({}),
}));

const mockNotesService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
  sendByEmail: jest.fn(),
};

describe('NotesController', () => {
  let controller: NotesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [{ provide: NotesService, useValue: mockNotesService }],
    }).compile();
    controller = module.get<NotesController>(NotesController);
  });

  describe('findAll', () => {
    it('delegates to service.findAll', () => {
      const notes = [{ id: 1, title: 'Test' }];
      mockNotesService.findAll.mockResolvedValue(notes);

      const result = controller.findAll();

      expect(result).toEqual(expect.any(Promise));
      expect(mockNotesService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('delegates to service.findOne with parsed id', () => {
      const note = { id: 3, title: 'Test' };
      mockNotesService.findOne.mockResolvedValue(note);

      controller.findOne(3);

      expect(mockNotesService.findOne).toHaveBeenCalledWith(3);
    });
  });

  describe('create', () => {
    it('creates note with currentUser id', async () => {
      mockNotesService.create.mockResolvedValue({ id: 10 });
      const dto = { title: '  Märge  ', content: '  Sisu  ', category: 'too', pinned: true };
      const user = { id: 'user-1', roles: ['USER'] } as any;

      await controller.create(dto, user);

      expect(mockNotesService.create).toHaveBeenCalledWith('Märge', 'Sisu', 'too', true, 'user-1');
    });

    it('trims title and content whitespace', async () => {
      mockNotesService.create.mockResolvedValue({ id: 12 });
      const dto = { title: '  Ruumiga  ', content: '  Sisu  ' };
      const user = { id: 'user-1', roles: ['USER'] } as any;

      await controller.create(dto as any, user);

      expect(mockNotesService.create).toHaveBeenCalledWith('Ruumiga', 'Sisu', undefined, undefined, 'user-1');
    });
  });

  describe('sendByEmail', () => {
    it('delegates to service.sendByEmail', async () => {
      mockNotesService.sendByEmail.mockResolvedValue(undefined);

      await controller.sendByEmail(5, { email: 'saaja@test.ee' });

      expect(mockNotesService.sendByEmail).toHaveBeenCalledWith(5, 'saaja@test.ee');
    });
  });

  describe('remove', () => {
    it('delegates to service.remove', async () => {
      mockNotesService.remove.mockResolvedValue(undefined);

      await controller.remove(7);

      expect(mockNotesService.remove).toHaveBeenCalledWith(7);
    });
  });
});
