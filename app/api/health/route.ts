import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getRedis } from "@/lib/redis";
import { getMinioClient } from "@/lib/storage/minio";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const checks = {
    postgres: false,
    redis: false,
    minio: false,
    app: true,
  };

  const details: Record<string, string> = {};

  // Check PostgreSQL
  try {
    await db.execute(sql`SELECT 1`);
    checks.postgres = true;
    details.postgres = "Connected";
  } catch (error) {
    details.postgres = `Error: ${error instanceof Error ? error.message : "Unknown"}`;
  }

  // Check Redis
  try {
    const redis = getRedis();
    await redis.ping();
    checks.redis = true;
    details.redis = "Connected";
  } catch (error) {
    details.redis = `Error: ${error instanceof Error ? error.message : "Unknown"}`;
  }

  // Check MinIO
  try {
    const minioClient = getMinioClient();
    await minioClient.listBuckets();
    checks.minio = true;
    details.minio = "Connected";
  } catch (error) {
    details.minio = `Error: ${error instanceof Error ? error.message : "Unknown"}`;
  }

  const allHealthy = Object.values(checks).every((check) => check === true);

  return Response.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: checks,
      details,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
