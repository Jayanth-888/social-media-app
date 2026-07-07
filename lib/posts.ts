import type { Post } from "@/types";

// Shared select shape so the feed's initial Server Component fetch
// (app/(dashboard)/feed/page.tsx) and the /api/posts route always return
// identically-shaped posts.
export function postSelect(viewerId: string | null) {
  return {
    id: true,
    content: true,
    imageUrl: true,
    createdAt: true,
    user: {
      select: { id: true, name: true, profileImage: true, headline: true },
    },
    _count: { select: { likes: true, comments: true } },
    likes: viewerId
      ? ({ where: { userId: viewerId }, select: { id: true } } as const)
      : (false as const),
  } as const;
}

export type PostWithSelect = {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  user: { id: string; name: string | null; profileImage: string | null; headline: string | null };
  _count: { likes: number; comments: number };
  likes?: { id: string }[] | false;
};

export function serializePost(p: PostWithSelect, viewerId: string | null): Post {
  return {
    id: p.id,
    content: p.content,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
    author: p.user,
    likesCount: p._count.likes,
    commentsCount: p._count.comments,
    isLikedByViewer: viewerId ? Array.isArray(p.likes) && p.likes.length > 0 : false,
  };
}