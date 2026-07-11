import { redis } from "@/lib/redis";

const FEED_CACHE_TTL_SECONDS = 60;
const FEED_VERSION_KEY = "feed:version";

// A single incrementing "version" acts as a cache-busting namespace.
// Bumping it invalidates every cached feed page at once, without having
// to enumerate or delete individual keys (KEYS/SCAN over Upstash's REST
// API is a real cost at scale — every call is a network round trip).
async function getFeedVersion(): Promise<number> {
  const version = await redis.get<number>(FEED_VERSION_KEY);
  return version ?? 0;
}

export async function bumpFeedVersion(): Promise<void> {
  await redis.incr(FEED_VERSION_KEY);
}

function buildFeedCacheKey(version: number, feed: string, viewerId: string | null): string {
  return `feed:v${version}:${feed}:${viewerId ?? "anon"}`;
}

export async function getCachedFeed<T>(feed: string, viewerId: string | null): Promise<T | null> {
  const version = await getFeedVersion();
  const cached = await redis.get<T>(buildFeedCacheKey(version, feed, viewerId));
  return cached ?? null;
}

export async function setCachedFeed<T>(feed: string, viewerId: string | null, data: T): Promise<void> {
  const version = await getFeedVersion();
  await redis.set(buildFeedCacheKey(version, feed, viewerId), data, { ex: FEED_CACHE_TTL_SECONDS });
}