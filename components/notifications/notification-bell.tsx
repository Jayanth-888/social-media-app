"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSocket, type AppNotification } from "@/components/providers/socket-provider";
import { timeAgo } from "@/lib/utils";

function notificationText(n: AppNotification) {
  switch (n.type) {
    case "FOLLOW":
      return "started following you";
    case "LIKE":
      return "liked your post";
    case "COMMENT":
      return "commented on your post";
  }
}

function notificationHref(n: AppNotification) {
  return n.post ? `/feed#post-${n.post.id}` : `/profile/${n.fromUser.id}`;
}

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useSocket();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm">
            Notifications
          </div>

          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No notifications yet</p>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={notificationHref(n)}
                onClick={() => {
                  if (!n.read) markAsRead(n.id);
                  setOpen(false);
                }}
                className={`block px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  n.read ? "bg-white" : "bg-blue-50"
                }`}
              >
                <p className="text-sm text-gray-800">
                  <span className="font-medium">{n.fromUser.name}</span>{" "}
                  {notificationText(n)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {timeAgo(n.createdAt)}
                </p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}