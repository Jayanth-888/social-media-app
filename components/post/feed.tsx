"use client";

import { useState } from "react";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/lib/fetcher";
import { PostCard } from "@/components/post/post-card";
import { Button } from "@/components/ui/button";
import type { PaginatedPosts } from "@/types";

type FeedMode = "explore" | "following";

export function Feed({ initialData }: { initialData: PaginatedPosts }) {
  const [mode, setMode] = useState<FeedMode>("explore");


  const { data, size, setSize, isValidating, mutate } = useSWRInfinite<PaginatedPosts>(
    (pageIndex, previousPageData: PaginatedPosts | null) => {
      if (previousPageData && previousPageData.nextCursor === null) return null;

      const params = new URLSearchParams();
      if (mode === "following") params.set("feed", "following");
      if (pageIndex > 0 && previousPageData?.nextCursor) {
        params.set("cursor", previousPageData.nextCursor);
      }

      const query = params.toString();
      return query ? `/api/posts?${query}` : "/api/posts";
    },
    fetcher,
    {
      fallbackData: mode === "explore" ? [initialData] : undefined,
      revalidateFirstPage: false,
    }
  );

  const pages = data ?? (mode === "explore" ? [initialData] : []);
  const posts = pages.flatMap((page) => page.posts);
  const lastPage = pages[pages.length - 1];
  const hasMore = lastPage?.nextCursor !== null && pages.length > 0;

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Button
          variant={mode === "explore" ? "primary" : "secondary"}
          onClick={() => setMode("explore")}
        >
          Explore
        </Button>
        <Button
          variant={mode === "following" ? "primary" : "secondary"}
          onClick={() => setMode("following")}
        >
          Following
        </Button>
      </div>

      <div className="flex flex-col divide-y divide-border">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onMutate={() => mutate()} />
        ))}
      </div>

      {posts.length === 0 && !isValidating && (
        <p className="py-6 text-center text-sm text-muted">
          {mode === "following" ? "Follow people to build your feed." : "No posts yet."}
        </p>
      )}

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" disabled={isValidating} onClick={() => setSize(size + 1)}>
            {isValidating ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}