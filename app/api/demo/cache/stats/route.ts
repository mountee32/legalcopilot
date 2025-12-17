import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export async function GET() {
  try {
    const redis = getRedis();
    const info = await redis.info("stats");
    const lines = info.split("\r\n");
    const stats: Record<string, string> = {};

    lines.forEach((line) => {
      if (line && !line.startsWith("#")) {
        const [key, value] = line.split(":");
        if (key && value) {
          stats[key] = value;
        }
      }
    });

    // Get memory info - redis is already initialized above
    const memoryInfo = await redis.info("memory");
    const memoryLines = memoryInfo.split("\r\n");

    memoryLines.forEach((line) => {
      if (line && !line.startsWith("#")) {
        const [key, value] = line.split(":");
        if (key && value && key.includes("used_memory")) {
          stats[key] = value;
        }
      }
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return NextResponse.json({ error: "Failed to get cache stats" }, { status: 500 });
  }
}
