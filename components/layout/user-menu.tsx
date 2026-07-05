"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

// Client Component: needs useSession() because it has to react live to
// auth state changes (e.g. after signOut()) without a full page reload.
// A Server Component can't do that — it only knows the session at the
// moment the page was rendered on the server.
export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-8 w-24 animate-pulse rounded bg-gray-100" />;
  }

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted">{session.user.name}</span>
      <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/login" })}>
        Log out
      </Button>
    </div>
  );
}