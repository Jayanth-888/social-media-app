"use client";

import { useCallback, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/lib/fetcher";
import { PostCard } from "@/components/post/post-card";
import { Button } from "@/components/ui/button";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
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

  // Functional update so this callback's identity doesn't need to change
  // every time `size` changes — keeps the IntersectionObserver from being
  // torn down and recreated on every page load.
  const loadNextPage = useCallback(() => {
    setSize((currentSize) => currentSize + 1);
  }, [setSize]);

  const sentinelRef = useIntersectionObserver({
    onIntersect: loadNextPage,
    enabled: hasMore && !isValidating,
  });

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

      {/* Sentinel: triggers loadNextPage via IntersectionObserver as it
          scrolls into view, ~200px before it's actually visible (see
          rootMargin default in useIntersectionObserver). */}
      {hasMore && <div ref={sentinelRef} className="h-10" />}

      {isValidating && posts.length > 0 && (
        <p className="py-4 text-center text-sm text-muted">Loading more...</p>
      )}
    </div>
  );
}