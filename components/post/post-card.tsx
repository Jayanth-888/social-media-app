import Image from "next/image";
import type { Post } from "@/types";
import { timeAgo } from "@/lib/utils";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="flex gap-3 py-4">
      <Image
        src={post.author.image ?? "/default-avatar.png"}
        alt={post.author.name ?? post.author.username}
        width={40}
        height={40}
        className="h-10 w-10 rounded-full object-cover"
      />
      <div className="flex-1">
        <div className="flex items-center gap-1 text-sm">
          <span className="font-semibold">{post.author.name}</span>
          <span className="text-muted">@{post.author.username}</span>
          <span className="text-muted">· {timeAgo(post.createdAt)}</span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-[15px]">{post.content}</p>
        <div className="mt-2 flex gap-6 text-sm text-muted">
          <span>💬 {post.commentsCount}</span>
          <span>{post.isLikedByViewer ? "❤️" : "🤍"} {post.likesCount}</span>
        </div>
      </div>
    </article>
  );
}
