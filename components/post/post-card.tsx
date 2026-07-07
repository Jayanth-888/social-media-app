"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import type { Comment, Post } from "@/types";
import { timeAgo } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { CommentItem } from "@/components/post/comment-item";

// CLIENT COMPONENT.
// This needs onClick handlers (like button, comment submit, delete) and
// local state (optimistic like count, the open/closed comment box, the
// fetched comment list) — none of which a Server Component can have,
// since it only ever runs once on the server and produces static HTML
// with no event listeners attached.
export function PostCard({ post, onMutate }: { post: Post; onMutate: () => void }) {
  const { data: session } = useSession();
  const isOwner = session?.user?.id === post.author.id;

  const [isLiked, setIsLiked] = useState(post.isLikedByViewer);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Only fetch this post's comments once the section is actually opened —
  // passing `null` as the key tells SWR not to fetch at all, so posts that
  // are never expanded never cost an extra request. Each comment here
  // includes its own replies nested one level deep (see lib/comments.ts).
  const {
    data: comments,
    mutate: mutateComments,
  } = useSWR<Comment[]>(showComments ? `/api/posts/${post.id}/comment` : null, fetcher);

  async function handleLike() {
    if (isLiking) return;
    setIsLiking(true);
    const previousLiked = isLiked;
    const previousCount = likesCount;
    setIsLiked(!previousLiked);
    setLikesCount(previousLiked ? previousCount - 1 : previousCount + 1);

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle like");
    } catch {
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
    } finally {
      setIsLiking(false);
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || isCommenting) return;
    setIsCommenting(true);

    try {
      const res = await fetch(`/api/posts/${post.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      setCommentText("");
      mutateComments();
      onMutate();
    } finally {
      setIsCommenting(false);
    }
  }

  async function handleDelete() {
    if (isDeleting) return;
    const confirmed = window.confirm("Delete this post? This can't be undone.");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete post");
      onMutate();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <article className="flex flex-col gap-3 py-4">
      <div className="flex gap-3">
        <Image
          src={post.author.profileImage ?? "/default-avatar.png"}
          alt={post.author.name ?? "User"}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm">
              <span className="font-semibold">{post.author.name}</span>
              <span className="text-muted">· {timeAgo(post.createdAt)}</span>
            </div>
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs text-muted hover:text-red-500"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
          <p className="mt-1 whitespace-pre-wrap text-[15px]">{post.content}</p>

          <div className="mt-2 flex gap-6 text-sm text-muted">
            <button onClick={() => setShowComments((v) => !v)} className="hover:text-foreground">
              💬 {post.commentsCount}
            </button>
            <button onClick={handleLike} disabled={isLiking} className="hover:text-foreground">
              {isLiked ? "❤️" : "🤍"} {likesCount}
            </button>
          </div>
        </div>
      </div>

      {showComments && (
        <div className="ml-[52px] flex flex-col gap-3">
          {comments === undefined && <p className="text-sm text-muted">Loading comments...</p>}
          {comments?.length === 0 && (
            <p className="text-sm text-muted">No comments yet. Be the first to reply.</p>
          )}
          {comments?.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={post.id}
              allowReply
              onChanged={mutateComments}
            />
          ))}

          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded-full border border-border px-3 py-1.5 text-sm"
            />
            <Button type="submit" disabled={isCommenting || !commentText.trim()}>
              Post
            </Button>
          </form>
        </div>
      )}
    </article>
  );
}