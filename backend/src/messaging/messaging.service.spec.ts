import { Test, TestingModule } from '@nestjs/testing';
import { MessagingService } from './messaging.service';
import { EventsGateway } from '../events/events.gateway';

const mockEvents = {
  notesChanged: jest.fn(),
  notifyToast: jest.fn(),
};

const mockChannel = {
  assertExchange: jest.fn().mockResolvedValue(undefined),
  assertQueue: jest.fn().mockResolvedValue({ queue: 'test-queue' }),
  bindQueue: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn(),
  consume: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
  ack: jest.fn(),
} as any;

const mockConnection = {
  createChannel: jest.fn().mockResolvedValue(mockChannel),
  close: jest.fn().mockResolvedValue(undefined),
};

jest.mock('amqplib', () => ({
  connect: jest.fn(),
}));

import * as amqp from 'amqplib';

describe('MessagingService', () => {
  let service: MessagingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);
    mockConnection.createChannel.mockResolvedValue(mockChannel);
    mockChannel.assertQueue.mockResolvedValue({ queue: 'test-queue' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        { provide: EventsGateway, useValue: mockEvents },
      ],
    }).compile();
    service = module.get<MessagingService>(MessagingService);
  });

  describe('onModuleInit', () => {
    it('connects to RabbitMQ and sets up channels', async () => {
      await service.onModuleInit();

      expect(amqp.connect).toHaveBeenCalled();
      expect(mockConnection.createChannel).toHaveBeenCalledTimes(2);
      expect(mockChannel.assertExchange).toHaveBeenCalledWith('notes_events', 'fanout', { durable: false });
    });

    it('starts consuming from the queue', async () => {
      await service.onModuleInit();

      expect(mockChannel.bindQueue).toHaveBeenCalledWith('test-queue', 'notes_events', '');
      expect(mockChannel.consume).toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('publishes event to the exchange', async () => {
      await service.onModuleInit();
      service.publish('notes:changed');

      expect(mockChannel.publish).toHaveBeenCalledWith(
        'notes_events',
        '',
        Buffer.from('notes:changed'),
      );
    });
  });

  describe('message consumer', () => {
    let consumeCallback: (msg: any) => void;

    beforeEach(async () => {
      mockChannel.consume.mockImplementation((_queue: string, cb: (msg: any) => void) => {
        consumeCallback = cb;
      });
      mockChannel.ack = jest.fn();
      await service.onModuleInit();
    });

    it('calls notesChanged for generic events', () => {
      consumeCallback({ content: Buffer.from('notes:changed') });
      expect(mockEvents.notesChanged).toHaveBeenCalled();
    });

    it('calls notifyToast for toast events', () => {
      const toastMsg = JSON.stringify({ type: 'toast', message: 'Salvestatud!', severity: 'success' });
      consumeCallback({ content: Buffer.from(toastMsg) });
      expect(mockEvents.notifyToast).toHaveBeenCalledWith('Salvestatud!', 'success');
    });

    it('calls notesChanged for invalid JSON', () => {
      consumeCallback({ content: Buffer.from('{invalid json}') });
      expect(mockEvents.notesChanged).toHaveBeenCalled();
    });

    it('ignores null messages', () => {
      consumeCallback(null);
      expect(mockEvents.notesChanged).not.toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('closes channels and connection', async () => {
      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(mockChannel.close).toHaveBeenCalledTimes(2);
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });
});
