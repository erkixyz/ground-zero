import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

const mockClientsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  search: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ClientsController', () => {
  let controller: ClientsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [{ provide: ClientsService, useValue: mockClientsService }],
    }).compile();
    controller = module.get<ClientsController>(ClientsController);
  });

  describe('findAll', () => {
    it('delegates to service.findAll', () => {
      mockClientsService.findAll.mockResolvedValue([]);
      controller.findAll();
      expect(mockClientsService.findAll).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('delegates to service.search with query', () => {
      mockClientsService.search.mockResolvedValue([]);
      controller.search('acme');
      expect(mockClientsService.search).toHaveBeenCalledWith('acme');
    });

    it('uses empty string when no query provided', () => {
      mockClientsService.search.mockResolvedValue([]);
      controller.search(undefined as any);
      expect(mockClientsService.search).toHaveBeenCalledWith('');
    });
  });

  describe('findOne', () => {
    it('delegates to service.findOne', () => {
      mockClientsService.findOne.mockResolvedValue({ id: '1' });
      controller.findOne('1');
      expect(mockClientsService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    it('passes name and regCode to service', async () => {
      const created = { id: 'new', name: 'Acme OÜ', regCode: '12345678', createdAt: new Date() };
      mockClientsService.create.mockResolvedValue(created);

      const result = await controller.create({ name: 'Acme OÜ', regCode: '12345678' });

      expect(mockClientsService.create).toHaveBeenCalledWith({ name: 'Acme OÜ', regCode: '12345678' });
      expect(result).toEqual(created);
    });

    it('passes undefined regCode when not provided', async () => {
      mockClientsService.create.mockResolvedValue({ id: 'new', name: 'Acme OÜ', regCode: null, createdAt: new Date() });

      await controller.create({ name: 'Acme OÜ' });

      expect(mockClientsService.create).toHaveBeenCalledWith({ name: 'Acme OÜ', regCode: undefined });
    });
  });

  describe('update', () => {
    it('passes id and dto fields to service', async () => {
      const updated = { id: '1', name: 'Uus Nimi', regCode: null, createdAt: new Date() };
      mockClientsService.update.mockResolvedValue(updated);

      const result = await controller.update('1', { name: 'Uus Nimi' });

      expect(mockClientsService.update).toHaveBeenCalledWith('1', { name: 'Uus Nimi', regCode: undefined });
      expect(result).toEqual(updated);
    });

    it('propagates NotFoundException from service', async () => {
      mockClientsService.update.mockRejectedValue(new NotFoundException());
      await expect(controller.update('missing', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('delegates to service.remove', async () => {
      mockClientsService.remove.mockResolvedValue(undefined);
      await controller.remove('1');
      expect(mockClientsService.remove).toHaveBeenCalledWith('1');
    });

    it('propagates NotFoundException from service', async () => {
      mockClientsService.remove.mockRejectedValue(new NotFoundException());
      await expect(controller.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
