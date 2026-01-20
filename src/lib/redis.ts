import Redis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error(
    "REDIS_URL environment variable is required. Please set it in your .env file.",
  );
}

export const redisClient = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      return null;
    }
    return Math.min(times * 50, 2000);
  },
  lazyConnect: false,
});
