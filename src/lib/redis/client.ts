import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

let _redis: Redis | null = null;
let _aiRateLimiter: Ratelimit | null = null;

function getRedis(): Redis {
  if (!_redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("Upstash Redis env vars are not set");
    }
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    return (getRedis() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export function getAiRateLimiter(): Ratelimit {
  if (!_aiRateLimiter) {
    _aiRateLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true,
      prefix: "resumeai:ratelimit",
    });
  }
  return _aiRateLimiter;
}

export const aiRateLimiter = new Proxy({} as Ratelimit, {
  get(_target, prop) {
    return (getAiRateLimiter() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const CacheKey = {
  resumeById: (id: string) => `resume:${id}`,
  userTier: (userId: string) => `user:tier:${userId}`,
  jobEval: (jobId: string, userId: string) => `job:eval:${jobId}:${userId}`,
} as const;
