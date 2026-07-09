import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const PAGE_SIZE = 20;

// GET /api/notifications
// GET /api/notifications?cursor=<notificationId>
export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      fromUser: { select: { id: true, name: true, profileImage: true } },
      post: { select: { id: true, content: true } },
    },
  });

  const hasMore = notifications.length > PAGE_SIZE;
  const items = hasMore ? notifications.slice(0, -1) : notifications;

  const unreadCount = await db.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return NextResponse.json({
    success: true,
    data: {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      unreadCount,
    },
  });
}
