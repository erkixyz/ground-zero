import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsService } from './organisations.service';

const mockOrganisationsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  search: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('OrganisationsController', () => {
  let controller: OrganisationsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganisationsController],
      providers: [{ provide: OrganisationsService, useValue: mockOrganisationsService }],
    }).compile();
    controller = module.get<OrganisationsController>(OrganisationsController);
  });

  it('findAll delegates to service', () => {
    mockOrganisationsService.findAll.mockResolvedValue([]);
    controller.findAll();
    expect(mockOrganisationsService.findAll).toHaveBeenCalled();
  });

  it('search delegates with query', () => {
    mockOrganisationsService.search.mockResolvedValue([]);
    controller.search('acme');
    expect(mockOrganisationsService.search).toHaveBeenCalledWith('acme');
  });

  it('search uses empty string when no query', () => {
    mockOrganisationsService.search.mockResolvedValue([]);
    controller.search(undefined as any);
    expect(mockOrganisationsService.search).toHaveBeenCalledWith('');
  });

  it('findOne delegates to service', () => {
    mockOrganisationsService.findOne.mockResolvedValue({ id: '1' });
    controller.findOne('1');
    expect(mockOrganisationsService.findOne).toHaveBeenCalledWith('1');
  });

  it('create passes all fields to service', async () => {
    const created = { id: 'new', name: 'Acme OÜ', createdAt: new Date() };
    mockOrganisationsService.create.mockResolvedValue(created);

    const result = await controller.create({ name: 'Acme OÜ', regCode: '12345678', country: 'EE' });

    expect(mockOrganisationsService.create).toHaveBeenCalledWith({
      name: 'Acme OÜ', regCode: '12345678', street: undefined, city: undefined, zip: undefined, country: 'EE',
    });
    expect(result).toEqual(created);
  });

  it('update passes all fields to service', async () => {
    const updated = { id: '1', name: 'Uus' };
    mockOrganisationsService.update.mockResolvedValue(updated);

    await controller.update('1', { name: 'Uus' });

    expect(mockOrganisationsService.update).toHaveBeenCalledWith('1', {
      name: 'Uus', regCode: undefined, street: undefined, city: undefined, zip: undefined, country: undefined,
    });
  });

  it('remove delegates to service', async () => {
    mockOrganisationsService.remove.mockResolvedValue(undefined);
    await controller.remove('1');
    expect(mockOrganisationsService.remove).toHaveBeenCalledWith('1');
  });

  it('remove propagates NotFoundException', async () => {
    mockOrganisationsService.remove.mockRejectedValue(new NotFoundException());
    await expect(controller.remove('missing')).rejects.toThrow(NotFoundException);
  });
});
