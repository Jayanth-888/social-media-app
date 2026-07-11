import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";

export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  prefix: "ratelimit:auth",
});

export const postCreateRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  prefix: "ratelimit:post-create",
});