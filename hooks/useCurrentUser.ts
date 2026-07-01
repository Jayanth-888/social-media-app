"use client";

import { useSession } from "next-auth/react";

/**
 * Thin wrapper around next-auth's useSession, giving components
 * a simpler `{ user, isLoading, isAuthenticated }` shape to consume.
 */
export function useCurrentUser() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
