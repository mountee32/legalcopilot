import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import redis from "@/lib/redis";
import { minioClient } from "@/lib/storage/minio";
import { emailQueue, imageQueue } from "@/lib/queue";
import { sql } from "drizzle-orm";

export async function GET() {
  const services: Record<string, { status: string; message?: string; details?: unknown }> = {
    database: { status: "unknown" },
    redis: { status: "unknown" },
    minio: { status: "unknown" },
    bullmq: { status: "unknown" },
  };

  // Test PostgreSQL
  try {
    await db.execute(sql`SELECT 1`);
    services.database = { status: "healthy", message: "Connected" };
  } catch (error) {
    services.database = {
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }

  // Test Redis
  try {
    await redis.ping();
    const info = await redis.info("server");
    const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
    services.redis = {
      status: "healthy",
      message: "Connected",
      details: { version },
    };
  } catch (error) {
    services.redis = {
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }

  // Test MinIO
  try {
    const buckets = await minioClient.listBuckets();
    services.minio = {
      status: "healthy",
      message: "Connected",
      details: { buckets: buckets.length },
    };
  } catch (error) {
    services.minio = {
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }

  // Test BullMQ
  try {
    const emailCounts = await emailQueue.getJobCounts();
    const imageCounts = await imageQueue.getJobCounts();
    services.bullmq = {
      status: "healthy",
      message: "Connected",
      details: {
        emailQueue: emailCounts,
        imageQueue: imageCounts,
      },
    };
  } catch (error) {
    services.bullmq = {
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }

  const allHealthy = Object.values(services).every((s) => s.status === "healthy");

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      services,
      timestamp: new Date().toISOString(),
    },
    { status: allHealthy ? 200 : 503 }
  );
}
