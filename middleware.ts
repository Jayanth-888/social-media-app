import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import type { Session } from "next-auth";
import { authConfig } from "@/auth.config";

// Build a separate, Edge-safe NextAuth instance from authConfig (which
// has no Credentials provider, so no bcrypt/Prisma gets bundled here).
// This `auth` is only used for reading the session in middleware — your
// real auth.ts + its Credentials provider are untouched and still used
// everywhere else (API routes, Server Components, etc).
const { auth } = NextAuth(authConfig);

// In Auth.js v5, `auth` doubles as the middleware function itself — wrap
// your logic in it and it injects `req.auth` (the session, or null).
// This replaces the old v4 pattern of `withAuth(middleware, options)`
// from "next-auth/middleware". The explicit type annotation below avoids
// a TS7006 implicit-any error some next-auth v5 beta releases don't
// infer automatically from the `auth()` overload.
export default auth((req: NextRequest & { auth: Session | null }) => {
  const isLoggedIn = !!req.auth;
  const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard");

  if (isDashboardRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

// The matcher decides which requests even run through this middleware —
// scoping it to /dashboard/* means every other route (marketing pages,
// the feed, API routes) isn't slowed down by an auth check it doesn't need.
export const config = {
  matcher: ["/dashboard/:path*"],
};