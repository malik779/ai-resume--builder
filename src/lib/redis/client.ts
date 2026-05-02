import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Singleton Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Per-user AI rate limiter — 10 requests / 10 seconds sliding window
// Prevents burst abuse on top of the monthly quota checks in the gate
export const aiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "resumeai:ratelimit",
});

// Cache keys
export const CacheKey = {
  resumeById: (id: string) => `resume:${id}`,
  userTier: (userId: string) => `user:tier:${userId}`,
  jobEval: (jobId: string, userId: string) => `job:eval:${jobId}:${userId}`,
} as const;
