import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/config';
import { getSession } from '../api/session';

const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

/** Subscribe to `records:changed` for the signed-in customer. Returns an unsubscribe function. */
export function subscribeRecords(onChange: () => void) {
  const token = getSession()?.accessToken;
  if (!token) return () => undefined;
  const socket: Socket = io(`${origin}/chat`, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  socket.on('records:changed', onChange);
  return () => {
    socket.off('records:changed', onChange);
    socket.disconnect();
  };
}
