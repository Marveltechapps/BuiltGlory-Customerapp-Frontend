import { io, type Socket } from 'socket.io-client';
import { SOCKET_URL } from '../api/config';
import { getAccessToken } from '../lib/session';

let socket: Socket | null = null;

export type SocketAck<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

function chatNamespaceUrl(): string {
  return `${SOCKET_URL.replace(/\/$/, '')}/chat`;
}

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(token?: string): Socket {
  const authToken = token || getAccessToken();
  if (!authToken) {
    throw new Error('Cannot connect chat socket without an access token.');
  }

  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.auth = { token: authToken };
    socket.connect();
    return socket;
  }

  socket = io(chatNamespaceUrl(), {
    autoConnect: true,
    transports: ['websocket', 'polling'],
    auth: { token: authToken },
  });

  return socket;
}

export function disconnectSocket(): void {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

export function joinSupportTicket(
  ticketId: string,
): Promise<SocketAck<{ ticket?: unknown }>> {
  const active = connectSocket();
  return new Promise((resolve) => {
    active.emit('support:join', { ticketId }, (ack: SocketAck<{ ticket?: unknown }>) => {
      resolve(ack);
    });
  });
}

export function leaveSupportTicket(
  ticketId: string,
): Promise<SocketAck> {
  const active = connectSocket();
  return new Promise((resolve) => {
    active.emit('support:leave', { ticketId }, (ack: SocketAck) => {
      resolve(ack);
    });
  });
}

export function joinSellRequest(
  sellRequestId: string,
): Promise<SocketAck<{ activity?: unknown }>> {
  const active = connectSocket();
  return new Promise((resolve) => {
    active.emit('sell:join', { sellRequestId }, (ack: SocketAck<{ activity?: unknown }>) => {
      resolve(ack);
    });
  });
}

export function onSocketEvent<T = unknown>(
  event: string,
  handler: (payload: T) => void,
): () => void {
  const active = connectSocket();
  active.on(event, handler);
  return () => {
    active.off(event, handler);
  };
}
