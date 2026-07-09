import { db } from "./db";

type NotificationType = "FOLLOW" | "LIKE" | "COMMENT";

interface CreateNotificationInput {
  userId: string; // recipient
  fromUserId: string; // actor
  type: NotificationType;
  postId?: string;
}

/**
 * Writes a notification to Postgres, then emits it live over Socket.io
 * if the recipient currently has an open connection. If they're offline,
 * it just sits in the DB and shows up next time they load /api/notifications.
 */
export async function createAndEmitNotification({
  userId,
  fromUserId,
  type,
  postId,
}: CreateNotificationInput) {
  // Don't notify people about their own actions (e.g. liking your own post)
  if (userId === fromUserId) return null;

  const notification = await db.notification.create({
    data: { userId, fromUserId, type, postId },
    include: {
      fromUser: { select: { id: true, name: true, profileImage: true } },
      post: { select: { id: true, content: true } },
    },
  });

  // io / userSocketMap are attached to Node's global object by server.ts
  // at startup. This only works because we run a custom server — on
  // Vercel serverless, this global would be empty on every invocation,
  // which is exactly why Vercel deployments use Pusher/Ably instead.
  const io = (global as any).io;
  const userSocketMap: Map<string, Set<string>> | undefined = (global as
    any).userSocketMap;

  const socketIds = userSocketMap?.get(userId);
  if (io && socketIds) {
    for (const socketId of socketIds) {
      io.to(socketId).emit("notification:new", notification);
    }
  }

  return notification;
}