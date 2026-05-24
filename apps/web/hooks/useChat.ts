import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: { id: string; name: string; avatarUrl?: string; role?: 'traveler' | 'transporter' };
  createdAt: string;
}

interface Notification {
  type: string;
  message?: Message;
  bookingId?: string;
  /** Unix ms timestamp added when notification is received — used for 5-min TTL */
  _receivedAt?: number;
  [key: string]: any;
}

// ── sessionStorage persistence ─────────────────────────────────────────────────
const STORAGE_KEY = 'smatway:notifications';
const NOTIF_TTL = 5 * 60 * 1000; // 5 minutes in ms

function loadStoredNotifications(): Notification[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const stored: Array<{ n: Notification; t: number }> = JSON.parse(raw);
    const cutoff = Date.now() - NOTIF_TTL;
    return stored
      .filter(item => item.t > cutoff)
      .map(item => ({ ...item.n, _receivedAt: item.t }));
  } catch {
    return [];
  }
}

function persistNotification(notification: Notification): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const stored: Array<{ n: Notification; t: number }> = raw ? JSON.parse(raw) : [];
    const cutoff = Date.now() - NOTIF_TTL;
    const fresh = stored.filter(item => item.t > cutoff);
    // Avoid duplicates by message id or bookingId+type
    const incomingId = notification.message?.id ?? `${notification.type}-${notification.bookingId ?? ''}-${notification._receivedAt}`;
    if (fresh.some(item => (item.n.message?.id ?? `${item.n.type}-${item.n.bookingId ?? ''}-${item.t}`) === incomingId)) return;
    fresh.unshift({ n: notification, t: notification._receivedAt ?? Date.now() });
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

function pruneStorage(): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const stored: Array<{ n: Notification; t: number }> = JSON.parse(raw);
    const cutoff = Date.now() - NOTIF_TTL;
    const fresh = stored.filter(item => item.t > cutoff);
    if (fresh.length !== stored.length) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    }
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
let lastBrowserNotificationRef: { key: string; time: number } | null = null;

export function useChat(userId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Map<string, Message[]>>(new Map());

  // Seed notifications from sessionStorage on first render so they survive
  // full-page reloads (e.g. browser notification click → window.location.href).
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (typeof window === 'undefined') return [];
    return loadStoredNotifications();
  });

  const lastNotificationRef = useRef<{ id: string; time: number } | null>(null);

  // Prune notifications older than 5 min from both state and sessionStorage.
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - NOTIF_TTL;
      setNotifications(prev => {
        const fresh = prev.filter(n => (n._receivedAt ?? 0) > cutoff);
        if (fresh.length === prev.length) return prev;
        pruneStorage();
        return fresh;
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const socket = io(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002', {
      query: { userId },
      reconnection: true,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('message', (message: Message) => {
      setMessages(prev => {
        const chatId = `chat-${message.id}`;
        const msgs = prev.get(chatId) || [];
        return new Map(prev).set(chatId, [...msgs, message]);
      });
    });

    socket.on('notification', (notification: Notification) => {
      const type = notification.type;
      const messageId = notification.message?.id;
      const now = Date.now();

      // ── Deduplicate ──────────────────────────────────────────────────────
      const lastNotif = lastNotificationRef.current;
      const isDuplicate =
        !!lastNotif && lastNotif.id === messageId && now - lastNotif.time < 1000;

      const notifKey =
        messageId ||
        `${type}:${notification.bookingId || ''}:${notification.message?.senderId || ''}:${notification.message?.createdAt || ''}`;

      const isGlobalDuplicate =
        !!lastBrowserNotificationRef &&
        lastBrowserNotificationRef.key === notifKey &&
        now - lastBrowserNotificationRef.time < 3000;

      if (isDuplicate) return;

      const enriched: Notification = { ...notification, _receivedAt: now };
      setNotifications(prev => [enriched, ...prev]);
      persistNotification(enriched);
      lastNotificationRef.current = { id: messageId || notifKey, time: now };

      if (Notification.permission !== 'granted' || isGlobalDuplicate) return;

      // ── Build OS notification content + click destination ─────────────────
      let title = 'SmatWay';
      let body = 'You have a new notification';
      let clickUrl = '';
      let openBell = false;

      if (type === 'booking') {
        const name = notification.traveler?.name || 'A traveler';
        const seats = notification.seatsBooked ?? 1;
        const route = notification.route ? ` · ${notification.route}` : '';
        title = `New booking${route}`;
        body = `${name} booked ${seats} seat${seats !== 1 ? 's' : ''} on your route`;
        clickUrl = '/dashboard/overview';
        openBell = true;

      } else if (type === 'booking_cancelled') {
        const name = notification.traveler?.name || 'A traveler';
        const seats = notification.seatsBooked ?? 1;
        const route = notification.route ? ` · ${notification.route}` : '';
        title = `Booking cancelled${route}`;
        body = `${name} cancelled ${seats} seat${seats !== 1 ? 's' : ''}`;
        clickUrl = '/dashboard/overview';
        openBell = true;

      } else if (type === 'booking_confirmed') {
        const name = notification.transporter?.name || 'Your transporter';
        const route = notification.route ? ` · ${notification.route}` : '';
        title = `Booking confirmed${route}`;
        body = `${name} confirmed your booking. You're all set!`;
        clickUrl = '/dashboard/my-bookings';
        openBell = true;

      } else if (type === 'booking_rejected') {
        const name = notification.transporter?.name || 'The transporter';
        const route = notification.route ? ` · ${notification.route}` : '';
        title = `Booking rejected${route}`;
        body = `${name} couldn't accept your booking. Your seats have been released.`;
        clickUrl = '/dashboard/my-bookings';
        openBell = true;

      } else if (type === 'booking_completed') {
        const name = notification.transporter?.name || 'Your transporter';
        const route = notification.route ? ` · ${notification.route}` : '';
        title = `Trip completed${route}`;
        body = `${name} marked your trip as complete. Leave a review!`;
        clickUrl = '/dashboard/my-bookings';
        openBell = true;

      } else if (type === 'message') {
        const senderName = notification.message?.sender?.name || 'Someone';
        const senderRole = notification.message?.sender?.role;
        const roleLabel = senderRole === 'traveler' ? 'Traveler' : 'Transporter';
        const content = notification.message?.content || '';
        title = `${senderName} · ${roleLabel}`;
        body = content.length > 80 ? content.slice(0, 77) + '…' : content || 'Sent you a message';
        const basePath = senderRole === 'traveler' ? '/dashboard/bookings' : '/dashboard/my-bookings';
        clickUrl = notification.bookingId
          ? `${basePath}?openChatBooking=${encodeURIComponent(notification.bookingId)}`
          : basePath;
      }

      const browserNotif = new Notification(title, {
        body,
        icon: '/smatway-favicon.svg',
      });

      browserNotif.onclick = () => {
        window.focus();
        if (openBell) sessionStorage.setItem('openNotifications', '1');
        if (clickUrl) window.location.href = clickUrl;
        browserNotif.close();
      };

      lastBrowserNotificationRef = { key: notifKey, time: now };
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [userId]);

  const joinChat = (chatId: string) => {
    if (socketRef.current?.connected) socketRef.current.emit('join-chat', { chatId });
  };

  const leaveChat = (chatId: string) => {
    if (socketRef.current?.connected) socketRef.current.emit('leave-chat', { chatId });
  };

  const sendMessage = (chatId: string, content: string) => {
    if (socketRef.current?.connected && userId) {
      socketRef.current.emit('message', { chatId, content, userId });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  return { connected, messages, notifications, joinChat, leaveChat, sendMessage, requestNotificationPermission };
}
