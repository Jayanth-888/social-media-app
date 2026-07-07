import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ApiResponse } from "@/types";

interface RouteParams {
  params: { id: string };
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const followerId = session.user.id;
  const followingId = params.id;

  if (followerId === followingId) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "You cannot follow yourself" },
      { status: 400 }
    );
  }

  const userExists = await db.user.findUnique({
    where: { id: followingId },
    select: { id: true },
  });

  if (!userExists) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "User not found" },
      { status: 404 }
    );
  }

  const existing = await db.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });

  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });

    return NextResponse.json<ApiResponse<{ following: boolean }>>({
      success: true,
      data: { following: false },
    });
  }

  await db.follow.create({
    data: {
      followerId,
      followingId,
    },
  });

  return NextResponse.json<ApiResponse<{ following: boolean }>>({
    success: true,
    data: { following: true },
  });
}