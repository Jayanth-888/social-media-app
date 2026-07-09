import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { auth } from "@/auth";

// GET /api/socket-token
// Issues a short-lived JWT (separate from the NextAuth session cookie)
// scoped to just { id: userId }, so the browser has something safe and
// minimal to hand to the raw Socket.io handshake.
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const token = jwt.sign(
    { id: session.user.id },
    process.env.AUTH_SECRET!,
    { expiresIn: "1h" }
  );

  return NextResponse.json({ success: true, data: { token } });
}