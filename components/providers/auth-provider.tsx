"use client";

import { SessionProvider } from "next-auth/react";

// next-auth's SessionProvider uses React context, so it must be a
// Client Component. Root layout stays a Server Component and just
// wraps {children} with this.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
