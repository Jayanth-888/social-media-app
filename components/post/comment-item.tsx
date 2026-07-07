"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import type { Comment } from "@/types";
import { timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CommentItemProps {
  comment: Comment;
  postId: string;
  /** Replies render without a reply button of their own — keeps threads one level deep. */
  allowReply: boolean;
  onChanged: () => void;
}

export function CommentItem({ comment, postId, allowReply, onChanged }: CommentItemProps) {
  const { data: session } = useSession();
  const isOwner = session?.user?.id === comment.author.id;

  const [isLiked, setIsLiked] = useState(comment.isLikedByViewer);
  const [likesCount, setLikesCount] = useState(comment.likesCount);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  async function handleLike() {
    if (isLiking) return;
    setIsLiking(true);
    const previousLiked = isLiked;
    const previousCount = likesCount;
    setIsLiked(!previousLiked);
    setLikesCount(previousLiked ? previousCount - 1 : previousCount + 1);

    try {
      const res = await fetch(`/api/comments/${comment.id}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle like");
    } catch {
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
    } finally {
      setIsLiking(false);
    }
  }

  async function handleDelete() {
    if (isDeleting) return;
    const confirmed = window.confirm("Delete this comment? This can't be undone.");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete comment");
      onChanged(); // refetch the post's comment list so this one disappears
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || isReplying) return;
    setIsReplying(true);

    try {
      const res = await fetch(`/api/comments/${comment.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText }),
      });
      if (!res.ok) throw new Error("Failed to post reply");
      setReplyText("");
      setShowReplyBox(false);
      onChanged(); // refetch so the new reply shows up nested under its parent
    } finally {
      setIsReplying(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Image
        src={comment.author.profileImage ?? "/default-avatar.png"}
        alt={comment.author.name ?? "User"}
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 rounded-full object-cover"
      />
      <div className="flex-1">
        <div className="inline-block rounded-2xl bg-gray-50 px-3 py-1.5">
          <div className="flex items-center gap-1 text-xs">
            <span className="font-semibold">{comment.author.name}</span>
            <span className="text-muted">· {timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm">{comment.text}</p>
        </div>

        <div className="mt-1 flex gap-3 text-xs text-muted">
          <button onClick={handleLike} disabled={isLiking} className="hover:text-foreground">
            {isLiked ? "❤️" : "🤍"} {likesCount > 0 ? likesCount : "Like"}
          </button>
          {allowReply && (
            <button onClick={() => setShowReplyBox((v) => !v)} className="hover:text-foreground">
              Reply
            </button>
          )}
          {isOwner && (
            <button onClick={handleDelete} disabled={isDeleting} className="hover:text-red-500">
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>

        {showReplyBox && (
          <form onSubmit={handleReply} className="mt-2 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${comment.author.name ?? "this comment"}...`}
              className="flex-1 rounded-full border border-border px-3 py-1 text-sm"
            />
            <Button type="submit" disabled={isReplying || !replyText.trim()}>
              Reply
            </Button>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 flex flex-col gap-2 border-l border-border pl-3">
            {comment.replies.map((reply: Comment) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                allowReply={false}
                onChanged={onChanged}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}