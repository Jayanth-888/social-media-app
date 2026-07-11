"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { useDebounce } from "@/hooks/useDebounce";
import { fetcher } from "@/lib/fetcher";

interface UserSearchResult {
  id: string;
  name: string | null;
  profileImage: string | null;
  headline: string | null;
}

export function UserSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data: results, isLoading } = useSWR<UserSearchResult[]>(
    debouncedQuery.trim() ? `/api/users/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    fetcher
  );

  return (
    <div className="relative w-full max-w-sm">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search people..."
        className="w-full rounded-full border border-border px-4 py-2 text-sm"
      />

      {debouncedQuery.trim() && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-white shadow-lg">
          {isLoading && <p className="p-3 text-sm text-muted">Searching...</p>}
          {results?.length === 0 && !isLoading && (
            <p className="p-3 text-sm text-muted">No users found.</p>
          )}
          {results?.map((user) => (
            <Link key={user.id} href={`/profile/${user.id}`} className="flex items-center gap-3 p-3 hover:bg-gray-50">
              <Image
                src={user.profileImage ?? "/default-avatar.png"}
                alt={user.name ?? "User"}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-medium">{user.name ?? "Unnamed user"}</p>
                {user.headline && <p className="text-xs text-muted">{user.headline}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}