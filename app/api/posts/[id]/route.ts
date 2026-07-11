import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ApiResponse } from "@/types";

// [id] is a dynamic segment: /api/posts/abc123 -> params.id === "abc123".
interface RouteParams {
  params: { id: string };
}

// DELETE /api/posts/[id] -> only the post's owner may delete it.
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const post = await db.post.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });

  if (!post) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Post not found" },
      { status: 404 }
    );
  }

  // Ownership check: the signed-in user must be the post's author.
  // This is checked server-side — never trust a client-supplied userId.
  if (session.user.id !== post.userId) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    // Delete dependent rows first, in dependency order, inside one
    // transaction — this works whether or not onDelete: Cascade is set
    // on the schema (a harmless no-op if it already is), and avoids the
    // foreign key violation from deleting a post that still has
    // comments/likes/notifications pointing at it.
    await db.$transaction([
      db.notification.deleteMany({ where: { postId: params.id } }),
      db.commentLike.deleteMany({ where: { comment: { postId: params.id } } }),
      db.like.deleteMany({ where: { postId: params.id } }),
      db.comment.deleteMany({ where: { postId: params.id } }),
      db.post.delete({ where: { id: params.id } }),
    ]);

    return NextResponse.json<ApiResponse<null>>({ success: true });
  } catch (err) {
    console.error("Failed to delete post:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to delete post" },
      { status: 500 }
    );
  }
}