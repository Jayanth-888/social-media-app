import type { Comment } from "@/types";

// Base fields shared by every comment fetch, whether it's a top-level
// comment or a reply. Kept as its own function (not spread conditionally
// into a bigger object) because Prisma's generic inference for nested
// `select` clauses can't reliably resolve types built from a conditional
// spread — passing a fully literal object at each call site is what lets
// TypeScript/Prisma agree on the exact shape returned.
function baseCommentFields(viewerId: string | null) {
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
  } as const;
}

/** Select for a single comment with no nested replies — used for replies themselves. */
export function commentSelect(viewerId: string | null) {
  return baseCommentFields(viewerId);
}

/**
 * Select for a top-level comment, including its replies one level deep.
 * Replies are selected with the same base fields (no further nesting), so
 * a reply's own `replies` is simply absent — threads stay one level flat.
 */
export function commentWithRepliesSelect(viewerId: string | null) {
  return {
    ...baseCommentFields(viewerId),
    replies: {
      orderBy: { createdAt: "asc" as const },
      select: baseCommentFields(viewerId),
    },
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
  // Only present on comments fetched with commentWithRepliesSelect().
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