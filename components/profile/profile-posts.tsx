"use client";

import { useRouter } from "next/navigation";
import { PostCard } from "@/components/post/post-card";
import type { Post } from "@/types";

interface ProfilePostsProps {
  posts: Post[];
}

export function ProfilePosts({ posts }: ProfilePostsProps) {
  const router = useRouter();

  if (posts.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No posts yet.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onMutate={() => router.refresh()} />
      ))}
    </div>
  );
}