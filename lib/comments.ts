import type { Comment } from "@/types";

// Select shape for a single comment, including its own like count/status
// and (for top-level comments) its replies with the same shape one level
// deep. Replies pass includeReplies=false so we never recurse further —
// a reply's `replies` field is simply omitted, keeping the thread flat.
export function commentSelect(viewerId: string | null, includeReplies: boolean) {
  return {
    id: true,
    text: true,
    createdAt: true,
    postId: true,
    parentId: true,
    user: {
      select: { id: true, name: true, profileImage: true, headline: true },
    },
    _count: { select: { likes: true } },
    likes: viewerId
      ? ({ where: { userId: viewerId }, select: { id: true } } as const)
      : (false as const),
    ...(includeReplies
      ? {
          replies: {
            orderBy: { createdAt: "asc" as const },
            select: {
              id: true,
              text: true,
              createdAt: true,
              postId: true,
              parentId: true,
              user: {
                select: { id: true, name: true, profileImage: true, headline: true },
              },
              _count: { select: { likes: true } },
              likes: viewerId
                ? ({ where: { userId: viewerId }, select: { id: true } } as const)
                : (false as const),
            },
          },
        }
      : {}),
  } as const;
}

type SelectedComment = {
  id: string;
  text: string;
  createdAt: Date;
  postId: string;
  parentId: string | null;
  user: { id: string; name: string | null; profileImage: string | null; headline: string | null };
  _count: { likes: number };
  likes?: { id: string }[] | false;
  replies?: SelectedComment[];
};

export function serializeComment(c: SelectedComment, viewerId: string | null): Comment {
  return {
    id: c.id,
    text: c.text,
    createdAt: c.createdAt.toISOString(),
    postId: c.postId,
    parentId: c.parentId,
    author: c.user,
    likesCount: c._count.likes,
    isLikedByViewer: viewerId ? Array.isArray(c.likes) && c.likes.length > 0 : false,
    replies: c.replies ? c.replies.map((r) => serializeComment(r, viewerId)) : undefined,
  };
}