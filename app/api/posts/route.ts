import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { postSelect, serializePost } from "@/lib/posts";
import type { ApiResponse, Post, PaginatedPosts } from "@/types";

const PAGE_SIZE = 10;

// GET /api/posts?cursor=<postId> -> cursor-paginated feed, newest first.
// Cursor pagination (rather than ?page=N/offset) stays correct even as new
// posts are inserted between requests, and scales better than OFFSET on a
// large table since Postgres can seek directly from the indexed createdAt/id
// instead of counting through skipped rows.
export async function GET(req: NextRequest) {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const cursor = req.nextUrl.searchParams.get("cursor");

  const posts = await db.post.findMany({
    take: PAGE_SIZE + 1, // fetch one extra to know if there's a next page
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    select: postSelect(viewerId),
  });

  const hasMore = posts.length > PAGE_SIZE;
  const page = hasMore ? posts.slice(0, PAGE_SIZE) : posts;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  type FetchedPost = (typeof posts)[number];
  const data: PaginatedPosts = {
    posts: page.map((p: FetchedPost) => serializePost(p, viewerId)),
    nextCursor,
  };

  return NextResponse.json<ApiResponse<PaginatedPosts>>({ success: true, data });
}

const createPostSchema = z.object({
  content: z.string().min(1, "Post cannot be empty").max(2000),
  imageUrl: z.string().url().optional(),
});

// POST /api/posts -> create a post. 401 if there's no session.
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
      userId: session.user.id,
    },
    select: postSelect(session.user.id),
  });

  return NextResponse.json<ApiResponse<Post>>(
    { success: true, data: serializePost(post, session.user.id) },
    { status: 201 }
  );
}