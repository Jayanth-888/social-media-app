import type { NextAuthConfig } from "next-auth";

// EDGE-SAFE CONFIG — used only by middleware.ts.
// No Credentials provider here: its authorize() needs bcrypt + Prisma,
// both of which require the Node.js runtime and cannot run in Next.js
// Edge Middleware. Middleware only needs to know "is there a session?",
// not how to create one — so this file intentionally leaves providers
// empty and just holds the pieces safe to bundle for Edge.
export const authConfig = {
  pages: {
    signIn: "/login", // update if your actual login route differs
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtectedRoute = nextUrl.pathname.startsWith("/dashboard");

      if (isProtectedRoute) {
        return isLoggedIn; // redirects to `pages.signIn` if false
      }
      return true;
    },
  },
  providers: [], // real providers are added in auth.ts, not here
} satisfies NextAuthConfig;