import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ApiResponse } from "@/types";

interface RouteParams {
  params: { commentId: string };
}

// POST /api/comments/[commentId]/like -> toggles a like for the signed-in
// user on this comment. Uses a separate CommentLike model (rather than
// reusing Like, which is scoped to postId) because a comment like and a
// post like are different facts about different rows.
export async function POST(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const commentId = params.commentId;

  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });
  if (!comment) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Comment not found" },
      { status: 404 }
    );
  }

  const existing = await db.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId } },
  });

  if (existing) {
    await db.commentLike.delete({ where: { id: existing.id } });
    return NextResponse.json<ApiResponse<{ liked: boolean }>>({
      success: true,
      data: { liked: false },
    });
  }

  await db.commentLike.create({ data: { commentId, userId } });
  return NextResponse.json<ApiResponse<{ liked: boolean }>>({
    success: true,
    data: { liked: true },
  });
}