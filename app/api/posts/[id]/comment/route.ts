import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { commentWithRepliesSelect, serializeComment } from "@/lib/comments";
import type { ApiResponse, Comment } from "@/types";
import { createAndEmitNotification } from "@/lib/notify";

interface RouteParams {
  params: { id: string };
}

// GET /api/posts/[id]/comment -> top-level comments for this post, oldest
// first, each with its own replies (one level deep) nested inside.
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const comments = await db.comment.findMany({
    where: { postId: params.id, parentId: null },
    orderBy: { createdAt: "asc" },
    select: commentWithRepliesSelect(viewerId),
  });

  const data: Comment[] = comments.map((c) => serializeComment(c, viewerId));
  return NextResponse.json<ApiResponse<Comment[]>>({ success: true, data });
}

const createCommentSchema = z.object({
  text: z.string().min(1, "Comment cannot be empty").max(1000),
});

// POST /api/posts/[id]/comment -> add a top-level comment to this post.
export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const postId = params.id;
  const post = await db.post.findUnique({
    where: { id: postId},
    select: { id: true, userId: true },
  });
  
  if (!post) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Post not found" },
      { status: 404 }
    );
  }

  const body = await req.json();
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const comment = await db.comment.create({
    data: {
      text: parsed.data.text,
      postId,
      userId: session.user.id,
    },
    select: commentWithRepliesSelect(session.user.id),
  });

  // Notify the post author
  if (post.userId !== session.user.id) {
    await createAndEmitNotification({
      userId: post.userId, // the post's author
      fromUserId: session.user.id, // whoever commented
      type: "COMMENT",
      postId: postId,
    });
  }

  const data = serializeComment(comment, session.user.id);
  return NextResponse.json<ApiResponse<Comment>>({ success: true, data }, { status: 201 });
}