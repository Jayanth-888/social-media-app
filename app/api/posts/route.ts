import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { postSelect, serializePost } from "@/lib/posts";
import type { ApiResponse, Post, PaginatedPosts } from "@/types";
import { bumpFeedVersion, getCachedFeed, setCachedFeed } from "@/lib/feed-cache";
import { postCreateRateLimit } from "@/lib/rate-limit";

const PAGE_SIZE = 10;

// Never let a Redis hiccup take down post creation — worst case on
// failure is a stale feed cache for up to 60s, which is far preferable
// to the request itself failing.
async function safelyBumpFeedVersion(): Promise<void> {
  try {
    await bumpFeedVersion();
  } catch (err) {
    console.error("Failed to bump feed cache version:", err);
  }
}

// GET /api/posts -> explore feed, newest first.
// GET /api/posts?feed=following -> posts from users I follow + myself.
// GET /api/posts?cursor=<postId> -> next page for either feed.
export async function GET(req: NextRequest) {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const cursor = req.nextUrl.searchParams.get("cursor");
  const feed = req.nextUrl.searchParams.get("feed") ?? "explore";

  if (!cursor) {
    const cached = await getCachedFeed<PaginatedPosts>(feed, viewerId);
    if (cached) {
      return NextResponse.json<ApiResponse<PaginatedPosts>>({ success: true, data: cached });
    }
  }

  const where =
    feed === "following" && viewerId
      ? {
          userId: {
            in: [
              viewerId,
              ...(await db.follow
                .findMany({
                  where: { followerId: viewerId },
                  select: { followingId: true },
                })
                .then((rows) => rows.map((row) => row.followingId))),
            ],
          },
        }
      : {};

  const posts = await db.post.findMany({
    where,
    take: PAGE_SIZE + 1,
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

  if (!cursor) {
    await setCachedFeed(feed, viewerId, data);
  }

  return NextResponse.json<ApiResponse<PaginatedPosts>>({
    success: true,
    data,
  });
}

const createPostSchema = z.object({
  content: z.string().min(1, "Post cannot be empty").max(2000),
  imageUrl: z.string().url().optional(),
});

// POST /api/posts -> create a post. 401 if there's no session, 429 if
// posting too fast.
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Keyed by user id (not IP) since the user is already authenticated here —
  // more accurate than IP, which can be shared behind NAT/corporate networks.
  // Fail OPEN on a rate-limiter error: a Redis outage should degrade to
  // "no rate limiting" rather than "nobody can post."
  try {
    const { success: withinLimit } = await postCreateRateLimit.limit(session.user.id);
    if (!withinLimit) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "You're posting too fast — please slow down." },
        { status: 429 }
      );
    }
  } catch (err) {
    console.error("Rate limiter check failed, allowing request:", err);
  }

  const body = await req.json();
  const parsed = createPostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      },
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

  await safelyBumpFeedVersion();

  return NextResponse.json<ApiResponse<Post>>(
    {
      success: true,
      data: serializePost(post, session.user.id),
    },
    { status: 201 }
  );
}