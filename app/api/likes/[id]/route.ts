import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ApiResponse } from "@/types";

const toggleLikeSchema = z.object({ postId: z.string().min(1) });

// POST /api/likes -> toggles a like on a post for the current user
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const parsed = toggleLikeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "postId is required" },
      { status: 400 }
    );
  }

  const userId = session.user.id;
  const { postId } = parsed.data;

  const existing = await db.like.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
    return NextResponse.json<ApiResponse<{ liked: boolean }>>({
      success: true,
      data: { liked: false },
    });
  }

  await db.like.create({ data: { postId, userId } });
  return NextResponse.json<ApiResponse<{ liked: boolean }>>({
    success: true,
    data: { liked: true },
  });
}