// Shared domain types used across components, hooks, and API responses.
// These mirror the Prisma models but are shaped for the client
// (e.g. dates as strings once serialized over JSON, counts instead of arrays).

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  profileImage: string | null;
  bio: string | null;
  headline: string | null;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowedByViewer?: boolean;
}

export interface PostAuthor {
  id: string;
  name: string | null;
  profileImage: string | null;
  headline: string | null;
}

export interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: PostAuthor;
  likesCount: number;
  commentsCount: number;
  isLikedByViewer: boolean;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: PostAuthor;
  postId: string;
}

export interface CreatePostInput {
  content: string;
  imageUrl?: string;
}

export interface CreateCommentInput {
  content: string;
  postId: string;
}

// Generic API response envelope used by every route handler in /app/api
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}