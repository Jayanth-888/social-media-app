import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ApiResponse } from "@/types";

// This has no Auth.js equivalent — Credentials provider only ever
// *verifies* a password at sign-in, it never creates a user. Registration
// is plain application logic: validate input, hash the password, insert
// a row. The client calls signIn("credentials", ...) right after this
// succeeds to log the new user in.
const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "An account with that email already exists" },
      { status: 409 }
    );
  }

  // 12 salt rounds is a reasonable default: strong enough, fast enough
  // for a serverless function's execution time budget.
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: { name, email, password: hashedPassword },
    select: { id: true, name: true, email: true, createdAt: true }, // never select password back out
  });

  return NextResponse.json<ApiResponse<typeof user>>(
    { success: true, data: user },
    { status: 201 }
  );
}