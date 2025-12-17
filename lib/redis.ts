import Redis from "ioredis";

let redis: Redis | null = null;

function getRedis(): Redis {
  if (redis) return redis;

  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL environment variable is not set");
  }

  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redis.on("connect", () => {
    console.log("✅ Redis connected");
  });

  redis.on("error", (error) => {
    console.error("❌ Redis connection error:", error);
  });

  return redis;
}

export { getRedis };
export default getRedis;
