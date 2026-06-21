import { Injectable, OnModuleDestroy, OnModuleInit, Inject } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly write: PrismaClient;
  readonly read: PrismaClient;

  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {
    this.write = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
      log: [
        { emit: "event", level: "query" },
        { emit: "event", level: "error" },
        { emit: "event", level: "warn" },
      ],
    });

    this.read = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_REPLICA_URL ?? process.env.DATABASE_URL!,
      }),
      log: [
        { emit: "event", level: "query" },
        { emit: "event", level: "error" },
        { emit: "event", level: "warn" },
      ],
    });

    this.write.$on("query" as never, (e: any) => {
      this.logger.debug("prisma_query", { db: "write", query: e.query, params: e.params, duration_ms: e.duration });
    });
    this.write.$on("error" as never, (e: any) => {
      this.logger.error("prisma_error", { db: "write", message: e.message, target: e.target });
    });

    this.read.$on("query" as never, (e: any) => {
      this.logger.debug("prisma_query", { db: "read", query: e.query, params: e.params, duration_ms: e.duration });
    });
    this.read.$on("error" as never, (e: any) => {
      this.logger.error("prisma_error", { db: "read", message: e.message, target: e.target });
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
