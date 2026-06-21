"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { useToast } from "./ToastProvider";

export default function LiveReloader() {
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001", {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("[LiveReloader] WebSocket ühendus loodud:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[LiveReloader] WebSocket ühendus katkes:", reason);
    });

    socket.on("notes:changed", () => {
      console.log("[LiveReloader] notes:changed — värskendab loendit");
      router.refresh();
    });

    socket.on("toast", ({ message, severity }: { message: string; severity: "success" | "error" | "info" | "warning" }) => {
      showToast(message, severity);
    });

    return () => {
      socket.disconnect();
    };
  }, [router, showToast]);

  return null;
}
