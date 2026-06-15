import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly write: PrismaClient;
  readonly read: PrismaClient;

  constructor() {
    this.write = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL!,
      }),
    });

    this.read = new PrismaClient({
      adapter: new PrismaPg({
        connectionString:
          process.env.DATABASE_REPLICA_URL ?? process.env.DATABASE_URL!,
      }),
    });
  }

  async onModuleInit() {
    await this.write.$connect();
    await this.read.$connect();
  }

  async onModuleDestroy() {
    await this.write.$disconnect();
    await this.read.$disconnect();
  }
}
