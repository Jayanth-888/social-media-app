"use client";

import { usePosts } from "@/hooks/usePosts";
import { PostCard } from "@/components/post/post-card";

export function Feed() {
  const { posts, isLoading, error } = usePosts();

  if (isLoading) return <p className="text-muted">Loading feed...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (posts.length === 0) return <p className="text-muted">No posts yet. Be the first to post!</p>;

  return (
    <div className="flex flex-col divide-y divide-border">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
