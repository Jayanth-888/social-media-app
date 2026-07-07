import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ApiResponse, UserProfile } from "@/types";

interface RouteParams {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const user = await db.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      bio: true,
      headline: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          followedBy: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "User not found" },
      { status: 404 }
    );
  }

  const follow = viewerId
    ? await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: user.id,
          },
        },
      })
    : null;

  const data: UserProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage,
    bio: user.bio,
    headline: user.headline,
    createdAt: user.createdAt.toISOString(),
    followersCount: user._count.followedBy,
    followingCount: user._count.following,
    postsCount: user._count.posts,
    isFollowing: Boolean(follow),
  };

  return NextResponse.json<ApiResponse<UserProfile>>({ success: true, data });
}