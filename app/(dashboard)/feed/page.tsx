import { auth } from "@/auth";
import { db } from "@/lib/db";
import { postSelect, serializePost } from "@/lib/posts";
import { Feed } from "@/components/post/feed";
import { CreatePost } from "@/components/post/create-post";
import type { PaginatedPosts } from "@/types";

const PAGE_SIZE = 10;

// SERVER COMPONENT.
// This page runs entirely on the server at request time. It calls auth()
// and Prisma directly — no fetch("/api/posts") round trip — because it's
// rendering on the same server that would otherwise have handled that
// fetch anyway. Skipping the HTTP hop means the very first paint already
// has real data baked into the HTML (good for perceived speed and SEO),
// and it needs zero client-side JavaScript to produce that first screen.
//
// It hands the initial page of posts down as a plain prop. From there,
// <Feed> (a Client Component) takes over for anything that happens after
// the page has loaded: liking, commenting, loading more pages, and
// revalidating — all of which are interactive, stateful operations that
// only make sense running in the browser.
export default async function FeedPage() {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const posts = await db.post.findMany({
    take: PAGE_SIZE + 1,
    orderBy: { createdAt: "desc" },
    select: postSelect(viewerId),
  });

  const hasMore = posts.length > PAGE_SIZE;
  const page = hasMore ? posts.slice(0, PAGE_SIZE) : posts;

  type FetchedPost = (typeof posts)[number];
  const initialData: PaginatedPosts = {
    posts: page.map((p: FetchedPost) => serializePost(p, viewerId)),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">Feed</h1>
      <CreatePost />
      <Feed initialData={initialData} />
    </main>
  );
}