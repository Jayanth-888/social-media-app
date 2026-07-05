import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ApiResponse, Post } from "@/types";

// GET /api/posts  -> returns the feed
// This replaces an Express route like: router.get("/posts", getFeed)
export async function GET() {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const posts = await db.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: {
        select: { id: true, name: true, profileImage: true, headline: true },
      },
      _count: { select: { likes: true, comments: true } },
      likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
    },
  });

  type PostWithRelations = (typeof posts)[number];

  const data: Post[] = posts.map((p: PostWithRelations) => ({
    id: p.id,
    content: p.content,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
    author: p.author,
    likesCount: p._count.likes,
    commentsCount: p._count.comments,
    isLikedByViewer: viewerId ? p.likes.length > 0 : false,
  }));

  return NextResponse.json<ApiResponse<Post[]>>({ success: true, data });
}

const createPostSchema = z.object({
  content: z.string().min(1, "Post cannot be empty").max(2000),
  imageUrl: z.string().url().optional(),
});

// POST /api/posts -> creates a new post
// This replaces an Express route like: router.post("/posts", authMiddleware, createPost)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const post = await db.post.create({
    data: {
      content: parsed.data.content,
      imageUrl: parsed.data.imageUrl,
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, name: true, profileImage: true, headline: true } },
    },
  });

  return NextResponse.json<ApiResponse<Post>>(
    {
      success: true,
      data: {
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        createdAt: post.createdAt.toISOString(),
        author: post.author,
        likesCount: 0,
        commentsCount: 0,
        isLikedByViewer: false,
      },
    },
    { status: 201 }
  );
}