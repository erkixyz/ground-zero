import { Logger } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({ cors: { origin: "*" } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

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
