"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-8 w-24 animate-pulse rounded bg-gray-100" />;
  }

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted">{session.user.name}</span>

      <Link
        href={`/profile/${session.user.id}`}
        className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
      >
        My Profile
      </Link>

      <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/login" })}>
        Log out
      </Button>
    </div>
  );
}