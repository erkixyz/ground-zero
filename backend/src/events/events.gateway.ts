import { Logger } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth/better-auth";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit(server: Server) {
    server.use(async (socket, next) => {
      try {
        const session = await auth.api.getSession({ headers: fromNodeHeaders(socket.handshake.headers) });
        if (!session?.user) {
          next(new Error("Unauthorized"));
          return;
        }
        next();
      } catch {
        next(new Error("Unauthorized"));
      }
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Klient ühendus: ${client.id} (kokku: ${this.server.sockets.sockets.size})`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Klient lahkus: ${client.id} (kokku: ${this.server.sockets.sockets.size - 1})`);
  }

  notesChanged() {
    const count = this.server.sockets.sockets.size;
    this.logger.log(`notes:changed → ${count} klient(i)`);
    this.server.emit("notes:changed");
  }

  notifyToast(message: string, severity: "success" | "error" | "info" | "warning" = "info") {
    const count = this.server.sockets.sockets.size;
    this.logger.log(`toast → ${count} klient(i): [${severity}] ${message}`);
    this.server.emit("toast", { message, severity });
  }
}
