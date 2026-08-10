'use client';

import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

// Các phòng cần tham gia. QUAN TRỌNG: phải tự join LẠI mỗi khi (re)connect,
// vì sau khi socket rớt + kết nối lại, server tạo phiên mới KHÔNG còn trong phòng cũ.
const joinedRooms = new Set<string>();

function emitJoin(room: string): void {
  const s = getSocket();
  if (room === 'pos') s.emit('join:pos');
  else if (room === 'admin') s.emit('join:admin');
  else if (room.startsWith('table:')) {
    s.emit('join:table', { tableNumber: room.slice('table:'.length) });
  }
}

/** Singleton Socket.io client (tái dùng 1 kết nối toàn app). */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      // websocket trước, nhưng CÓ fallback polling để bền trên Railway/proxy.
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Mỗi lần kết nối (kể cả sau khi reconnect) -> tham gia lại MỌI phòng đã đăng ký.
    socket.on('connect', () => {
      joinedRooms.forEach((room) => emitJoin(room));
    });
  }
  return socket;
}

/** Vào các phòng tương ứng với từng màn hình (nhớ phòng để tự join lại khi reconnect). */
export const socketRooms = {
  joinPos: () => {
    joinedRooms.add('pos');
    emitJoin('pos');
  },
  joinAdmin: () => {
    joinedRooms.add('admin');
    emitJoin('admin');
  },
  joinTable: (tableNumber: string) => {
    joinedRooms.add(`table:${tableNumber}`);
    emitJoin(`table:${tableNumber}`);
  },
};

/**
 * Hook lắng nghe 1 sự kiện Socket.io, tự gỡ listener khi unmount.
 * Lưu ý: bọc `handler` bằng useCallback ở component để tránh đăng ký lại mỗi render.
 */
export function useSocketEvent<T>(
  event: string,
  handler: (data: T) => void,
): void {
  useEffect(() => {
    const s = getSocket();
    s.on(event, handler);
    return () => {
      s.off(event, handler);
    };
  }, [event, handler]);
}