"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";

interface NotificationUser {
  id: string;
  name: string;
  profileImage: string | null;
}

interface NotificationPost {
  id: string;
  content: string;
}

export interface AppNotification {
  id: string;
  type: "FOLLOW" | "LIKE" | "COMMENT";
  read: boolean;
  createdAt: string;
  fromUser: NotificationUser;
  post: NotificationPost | null;
}

interface SocketContextValue {
  socket: Socket | null;
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
});

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notification history once the user is known
  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/notifications")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setNotifications(json.data.items);
          setUnreadCount(json.data.unreadCount);
        }
      });
  }, [status]);

  // Open the socket connection once the user is known
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    let cancelled = false;

    (async () => {
      const res = await fetch("/api/socket-token");
      const json = await res.json();
      if (!json.success || cancelled) return;

      const socket = io({ auth: { token: json.data.token } });
      socketRef.current = socket;

      socket.on("notification:new", (notification: AppNotification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [status, session?.user?.id]);

  const markAsRead = async (id: string) => {
    // Optimistic update — flips instantly in the UI
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });

      if (!res.ok) {
        throw new Error(`PATCH failed with status ${res.status}`);
      }
    } catch (err) {
      // The persist failed — revert the optimistic update so the UI
      // matches reality, instead of silently drifting out of sync with
      // the database (which is what caused the badge to "come back"
      // on refresh).
      console.error("Failed to mark notification as read:", err);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  };

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, notifications, unreadCount, markAsRead }}
    >
      {children}
    </SocketContext.Provider>
  );
}