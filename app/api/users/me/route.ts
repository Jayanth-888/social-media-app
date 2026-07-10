import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ApiResponse, UserProfile } from "@/types";

interface UpdateBody {
  bio?: string;
  headline?: string;
  profileImage?: string;
}

function validateBody(body: unknown): { data: UpdateBody; errors: string[] } {
  const errors: string[] = [];
  const b = (body ?? {}) as Record<string, unknown>;
  const data: UpdateBody = {};

  if (b.bio !== undefined) {
    if (typeof b.bio !== "string" || b.bio.length > 280) errors.push("bio must be a string up to 280 characters");
    else data.bio = b.bio;
  }
  if (b.headline !== undefined) {
    if (typeof b.headline !== "string" || b.headline.length > 100) errors.push("headline must be a string up to 100 characters");
    else data.headline = b.headline;
  }
  if (b.profileImage !== undefined) {
    if (typeof b.profileImage !== "string" || !b.profileImage.startsWith("http")) errors.push("profileImage must be a valid URL");
    else data.profileImage = b.profileImage;
  }

  return { data, errors };
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const { data, errors } = validateBody(body);

  if (errors.length > 0) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: errors.join("; ") },
      { status: 400 }
    );
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const user = await db.user.update({
    where: { id: session.user.id }, // scoped to session's own id — no body-supplied id
    data,
    select: { id: true, name: true, email: true, bio: true, headline: true, profileImage: true, createdAt: true },
  });

  return NextResponse.json<ApiResponse<Partial<UserProfile>>>({
    success: true,
    data: { ...user, createdAt: user.createdAt.toISOString() },
  });
}