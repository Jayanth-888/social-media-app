import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ApiResponse } from "@/types";

interface UserSearchResult {
  id: string;
  name: string | null;
  profileImage: string | null;
  headline: string | null;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json<ApiResponse<UserSearchResult[]>>({ success: true, data: [] });
  }

  const users = await db.user.findMany({
    where: {
      name: { contains: q, mode: "insensitive" },
      id: { not: session.user.id }, // exclude yourself from your own results
    },
    take: 10,
    select: { id: true, name: true, profileImage: true, headline: true },
  });

  return NextResponse.json<ApiResponse<UserSearchResult[]>>({ success: true, data: users });
}