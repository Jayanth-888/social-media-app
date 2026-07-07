import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ApiResponse } from "@/types";

interface RouteParams {
  params: { commentId: string };
}

// DELETE /api/comments/[commentId] -> only the comment's author may delete
// it. If this is a top-level comment, its replies are removed too via the
// self-relation's onDelete: Cascade in the schema.
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const comment = await db.comment.findUnique({
    where: { id: params.commentId },
    select: { userId: true },
  });

  if (!comment) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Comment not found" },
      { status: 404 }
    );
  }

  if (session.user.id !== comment.userId) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  await db.comment.delete({ where: { id: params.commentId } });
  return NextResponse.json<ApiResponse<null>>({ success: true });
}