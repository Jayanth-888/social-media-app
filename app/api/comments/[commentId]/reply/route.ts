import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { commentSelect, serializeComment } from "@/lib/comments";
import type { ApiResponse, Comment } from "@/types";

interface RouteParams {
  params: { commentId: string };
}

const replySchema = z.object({
  text: z.string().min(1, "Reply cannot be empty").max(1000),
});

// POST /api/comments/[commentId]/reply -> add a reply to a comment.
// Threads are kept exactly one level deep: if you reply to a reply, the
// new comment attaches to that reply's parent instead, so the UI never
// has to render arbitrarily nested threads.
export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const target = await db.comment.findUnique({
    where: { id: params.commentId },
    select: { id: true, postId: true, parentId: true },
  });
  if (!target) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Comment not found" },
      { status: 404 }
    );
  }

  const body = await req.json();
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  // Collapse to the top-level parent if the target is itself a reply.
  const effectiveParentId = target.parentId ?? target.id;

  const reply = await db.comment.create({
    data: {
      text: parsed.data.text,
      postId: target.postId,
      userId: session.user.id,
      parentId: effectiveParentId,
    },
    select: commentSelect(session.user.id, false),
  });

  const data: Comment = serializeComment(reply, session.user.id);
  return NextResponse.json<ApiResponse<Comment>>({ success: true, data }, { status: 201 });
}