import Redis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is not set");
}

export const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Test connection
redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (error) => {
  console.error("❌ Redis connection error:", error);
});

export default redis;
