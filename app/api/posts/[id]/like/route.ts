import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ApiResponse } from "@/types";

interface RouteParams {
  params: { id: string };
}

// POST /api/posts/[id]/like -> toggles a like for the signed-in user on
// this post. Nested under the post's own path (rather than a flat
// /api/likes with postId in the body) because a like only ever exists in
// the context of one specific post — the URL should say so.
export async function POST(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const postId = params.id;

  const post = await db.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Post not found" },
      { status: 404 }
    );
  }

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