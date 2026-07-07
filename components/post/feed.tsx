"use client";

import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/lib/fetcher";
import { PostCard } from "@/components/post/post-card";
import { Button } from "@/components/ui/button";
import type { PaginatedPosts } from "@/types";

// CLIENT COMPONENT.
// Pagination ("load more"), cache revalidation, and mutating local state
// after a like/comment are all interactive concerns that only exist in the
// browser — a Server Component has no lifecycle to hook into after its
// initial render, so anything that needs to react to a click has to live
// on the client.
//
// useSWRInfinite manages the list of pages itself: each entry in `pages`
// is one PaginatedPosts response, and `getKey` tells SWR how to compute the
// next page's request URL from the previous page's `nextCursor`.
export function Feed({ initialData }: { initialData: PaginatedPosts }) {
  const { data, size, setSize, isValidating, mutate } = useSWRInfinite<PaginatedPosts>(
    (pageIndex, previousPageData: PaginatedPosts | null) => {
      if (previousPageData && previousPageData.nextCursor === null) return null; // no more pages
      if (pageIndex === 0) return "/api/posts";
      return `/api/posts?cursor=${previousPageData?.nextCursor}`;
    },
    fetcher,
    {
      // The server already fetched page one for us (see feed/page.tsx) — seed
      // SWR's cache with it so there's no duplicate fetch or loading flash
      // on first render.
      fallbackData: [initialData],
      revalidateFirstPage: false,
    }
  );

  const pages = data ?? [initialData];
  const posts = pages.flatMap((page) => page.posts);
  const lastPage = pages[pages.length - 1];
  const hasMore = lastPage?.nextCursor !== null;

  return (
    <div>
      <div className="flex flex-col divide-y divide-border">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onMutate={() => mutate()} />
        ))}
      </div>
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