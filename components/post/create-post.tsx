"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ApiResponse, Post } from "@/types";

// CLIENT COMPONENT.
// A controlled <textarea> and a submit handler both require React state
// and event listeners — this only works as a Client Component. After a
// successful post, router.refresh() re-runs the Server Component tree
// (FeedPage) so the new post appears without a full page reload.
export function CreatePost() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json: ApiResponse<Post> = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to create post");

      setContent("");
      router.refresh(); // re-fetches the Server Component's initial page of posts
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2 border-b border-border pb-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        rows={3}
        maxLength={2000}
        className="w-full resize-none rounded-lg border border-border p-3 text-[15px]"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </div>
    </form>
  );
}