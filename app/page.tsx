import { Feed } from "@/components/post/feed";

// Server Component by default: no "use client" needed since it does no
// hooks/state here. Data fetching for the feed happens client-side via
// usePosts() inside <Feed />, but you could equally fetch here with
// `await db.post.findMany()` and pass data down as props.
export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">Home</h1>
      <Feed />
    </main>
  );
}
