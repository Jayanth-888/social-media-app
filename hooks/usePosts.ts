"use client";

import { useEffect, useState, useCallback } from "react";
import type { Post, ApiResponse } from "@/types";

/**
 * Fetches the feed from /app/api/posts and exposes a refetch()
 * so components (e.g. after creating a post) can refresh the list.
 */
export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/posts");
      const json: ApiResponse<Post[]> = await res.json();
      if (!json.success || !json.data) throw new Error(json.error ?? "Failed to load posts");
      setPosts(json.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, isLoading, error, refetch: fetchPosts };
}
