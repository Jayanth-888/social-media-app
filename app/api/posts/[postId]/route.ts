import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ApiResponse } from "@/types";

// The folder name [postId] makes this a dynamic route.
// A request to /api/posts/abc123 gives you params.postId === "abc123",
// equivalent to Express's router.get("/posts/:postId", ...).
interface RouteParams {
  params: { postId: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const post = await db.post.findUnique({
    where: { id: params.postId },
    include: {
      author: { select: { id: true, name: true, profileImage: true, headline: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!post) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Post not found" },
      { status: 404 }
    );
  }

  return NextResponse.json<ApiResponse<typeof post>>({ success: true, data: post });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const post = await db.post.findUnique({ where: { id: params.postId } });
  if (!post) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Post not found" },
      { status: 404 }
    );
  }
  if (post.authorId !== session.user.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  await db.post.delete({ where: { id: params.postId } });
  return NextResponse.json<ApiResponse<null>>({ success: true });
}