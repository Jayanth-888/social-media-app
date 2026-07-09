import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// PATCH /api/notifications/[id]/read
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const notification = await db.notification.findUnique({
    where: { id: params.id },
  });

  if (!notification || notification.userId !== session.user.id) {
    return NextResponse.json(
      { success: false, error: "Not found" },
      { status: 404 }
    );
  }

  const updated = await db.notification.update({
    where: { id: params.id },
    data: { read: true },
  });

  return NextResponse.json({ success: true, data: updated });
}