import { io, type ManagerOptions, type SocketOptions } from "socket.io-client";
import { useAuthStore } from "@/stores/use-auth.store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

/**
 * Opens a Socket.IO connection to the API with the user's access token.
 * The server rejects sockets without a valid token.
 */
export function connectSocket(options: Partial<ManagerOptions & SocketOptions> = {}) {
  return io(API_URL, {
    ...options,
    auth: (cb) => cb({ token: useAuthStore.getState().token }),
  });
}
