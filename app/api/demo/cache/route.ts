import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Cache key is required" }, { status: 400 });
    }

    const value = await redis.get(key);
    const ttl = await redis.ttl(key);

    return NextResponse.json({
      key,
      value,
      ttl: ttl > 0 ? ttl : null,
      hit: value !== null,
    });
  } catch (error) {
    console.error("Error getting cache:", error);
    return NextResponse.json({ error: "Failed to get cache value" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, ttl } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
    }

    if (ttl) {
      await redis.setex(key, ttl, value);
    } else {
      await redis.set(key, value);
    }

    return NextResponse.json({ success: true, key, value });
  } catch (error) {
    console.error("Error setting cache:", error);
    return NextResponse.json({ error: "Failed to set cache value" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Cache key is required" }, { status: 400 });
    }

    await redis.del(key);

    return NextResponse.json({ success: true, key });
  } catch (error) {
    console.error("Error deleting cache:", error);
    return NextResponse.json({ error: "Failed to delete cache value" }, { status: 500 });
  }
}
