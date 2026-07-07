import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ApiResponse, Comment } from "@/types";

interface RouteParams {
  params: { id: string };
}

// GET /api/posts/[id]/comment -> list comments for this post, oldest first.
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const comments = await db.comment.findMany({
    where: { postId: params.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      text: true,
      createdAt: true,
      postId: true,
      user: { select: { id: true, name: true, profileImage: true, headline: true } },
    },
  });

  type FetchedComment = (typeof comments)[number];
  const data: Comment[] = comments.map((c: FetchedComment) => ({
    id: c.id,
    text: c.text,
    createdAt: c.createdAt.toISOString(),
    postId: c.postId,
    author: c.user,
  }));

  return NextResponse.json<ApiResponse<Comment[]>>({ success: true, data });
}

const createCommentSchema = z.object({
  text: z.string().min(1, "Comment cannot be empty").max(1000),
});

// POST /api/posts/[id]/comment -> add a comment to this post.
export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const postId = params.id;
  const post = await db.post.findUnique({ where: { id: postId }, select: { id: true } });
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
    select: {
      id: true,
      text: true,
      createdAt: true,
      postId: true,
      user: { select: { id: true, name: true, profileImage: true, headline: true } },
    },
  });

  const data: Comment = {
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
    postId: comment.postId,
    author: comment.user,
  };

  return NextResponse.json<ApiResponse<Comment>>({ success: true, data }, { status: 201 });
}