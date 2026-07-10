import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { FollowButton } from "@/components/profile/follow-button";
import { postSelect, serializePost } from "@/lib/posts";
import { ProfilePosts } from "@/components/profile/profile-posts";

interface ProfilePageProps {
  params: { id: string };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const user = await db.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      bio: true,
      headline: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          followedBy: true,
          following: true,
        },
      },
    },
  });

  if (!user) notFound();

  const isOwnProfile = viewerId === user.id;

  const follow = viewerId
    ? await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: user.id,
          },
        },
      })
    : null;

  const posts = await db.post.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: postSelect(viewerId),
  });

  type FetchedPost = (typeof posts)[number];
  const profilePosts = posts.map((post: FetchedPost) => serializePost(post, viewerId));

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
        <Link href="/feed" className="mb-4 inline-flex rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-gray-50">
            Back to Feed
        </Link>
      <section className="flex gap-4 border-b border-border pb-6">
        <Image
          src={user.profileImage ?? "/default-avatar.png"}
          alt={user.name ?? "User"}
          width={88}
          height={88}
          className="h-[88px] w-[88px] rounded-full object-cover"
        />

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold">{user.name ?? "Unnamed user"}</h1>
            {isOwnProfile && (
              <Link
                href="/profile/edit"
                className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold hover:bg-gray-50"
              >
                Edit profile
              </Link>
            )}
          </div>
          {user.headline && <p className="text-sm text-muted">{user.headline}</p>}
          {user.bio && <p className="mt-3 text-sm">{user.bio}</p>}

          <div className="mt-4 flex gap-4 text-sm text-muted">
            <span>{user._count.posts} posts</span>
            <span>{user._count.followedBy} followers</span>
            <span>{user._count.following} following</span>
          </div>

          <div className="mt-4">
            <FollowButton
              userId={user.id}
              initialIsFollowing={Boolean(follow)}
              initialFollowersCount={user._count.followedBy}
              isOwnProfile={isOwnProfile}
            />
          </div>
        </div>
      </section>

      <section className="pt-4">
        <h2 className="mb-2 text-lg font-semibold">Posts</h2>
        <ProfilePosts posts={profilePosts} />
      </section>
    </main>
  );
}