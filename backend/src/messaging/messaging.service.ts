import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import * as amqp from "amqplib";
import { EventsGateway } from "../events/events.gateway";

const EXCHANGE = "notes_events";

@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagingService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private connection: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private publishChannel: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private consumeChannel: any;

  constructor(private readonly events: EventsGateway) {}

  async onModuleInit() {
    const url = process.env.RABBITMQ_URL || "amqp://localhost:5672";
    this.connection = await amqp.connect(url);
    this.logger.log("RabbitMQ ühendus loodud");

    this.publishChannel = await this.connection.createChannel();
    await this.publishChannel.assertExchange(EXCHANGE, "fanout", { durable: false });

    this.consumeChannel = await this.connection.createChannel();
    await this.consumeChannel.assertExchange(EXCHANGE, "fanout", { durable: false });
    const { queue } = await this.consumeChannel.assertQueue("", { exclusive: true });
    await this.consumeChannel.bindQueue(queue, EXCHANGE, "");

    this.consumeChannel.consume(queue, (msg) => {
      if (!msg) return;
      this.consumeChannel.ack(msg);
      try {
        const payload = JSON.parse(msg.content.toString());
        if (payload.type === "toast") {
          this.events.notifyToast(payload.message, payload.severity);
        } else {
          this.events.notesChanged();
        }
      } catch {
        this.events.notesChanged();
      }
    });

    this.logger.log(`Kuulan järjekorda: ${queue}`);
  }

  publish(event: string) {
    this.publishChannel.publish(EXCHANGE, "", Buffer.from(event));
    this.logger.log(`Avaldasin: ${event}`);
  }

  async onModuleDestroy() {
    await this.publishChannel?.close();
    await this.consumeChannel?.close();
    await this.connection?.close();
  }
}
