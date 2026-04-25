import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let socketPromise: Promise<Socket> | null = null;

async function createSocket(): Promise<Socket> {
  return new Promise((resolve) => {
    const newSocket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['polling'],
      reconnection: false,
      timeout: 10000
    });

    const onConnect = () => {
      console.log('🔌 Socket connected:', newSocket.id);
      newSocket.off('connect', onConnect);
      resolve(newSocket);
    };

    newSocket.on('connect', onConnect);
    newSocket.on('connect_error', (err) => {
      console.error('🔌 Socket connection error:', err.message);
    });
  });
}

export async function getSocket(): Promise<Socket> {
  if (socket?.connected) {
    return socket;
  }

  if (socketPromise) {
    return socketPromise;
  }

  socketPromise = createSocket().then((s) => {
    socket = s;
    socketPromise = null;
    return s;
  });

  return socketPromise;
}

export async function subscribeToKeywords(keywords: string[]): Promise<void> {
  const s = await getSocket();
  s.emit('subscribe', keywords);
}

export async function unsubscribeFromKeywords(keywords: string[]): Promise<void> {
  const s = await getSocket();
  s.emit('unsubscribe', keywords);
}

export interface HotspotEvent {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string;
  importance: string;
  summary: string | null;
  keyword?: { text: string } | null;
}

export interface NotificationEvent {
  type: string;
  title: string;
  content: string;
  hotspotId?: string;
  importance?: string;
}

export async function onNewHotspot(callback: (hotspot: HotspotEvent) => void): Promise<() => void> {
  const s = await getSocket();
  s.on('hotspot:new', callback);
  return () => s.off('hotspot:new', callback);
}

export async function onNotification(callback: (notification: NotificationEvent) => void): Promise<() => void> {
  const s = await getSocket();
  s.on('notification', callback);
  return () => s.off('notification', callback);
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketPromise = null;
  }
}
