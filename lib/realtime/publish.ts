import { getRedis } from "@/lib/redis";
import { firmChannel, matterChannel } from "./channels";
import { randomUUID } from "crypto";

export type RealtimeEvent = {
  id: string;
  type: string;
  firmId: string;
  matterId?: string;
  createdAt: string;
  payload?: Record<string, unknown>;
};

function canPublish(): boolean {
  return !!process.env.REDIS_URL;
}

export async function publishFirmEvent(
  firmId: string,
  type: string,
  payload?: Record<string, unknown>
): Promise<void> {
  if (!canPublish()) return;
  const redis = getRedis();
  const event: RealtimeEvent = {
    id: randomUUID(),
    type,
    firmId,
    createdAt: new Date().toISOString(),
    payload,
  };
  await redis.publish(firmChannel(firmId), JSON.stringify(event));
}

export async function publishMatterEvent(
  firmId: string,
  matterId: string,
  type: string,
  payload?: Record<string, unknown>
): Promise<void> {
  if (!canPublish()) return;
  const redis = getRedis();
  const event: RealtimeEvent = {
    id: randomUUID(),
    type,
    firmId,
    matterId,
    createdAt: new Date().toISOString(),
    payload,
  };
  await redis.publish(matterChannel(matterId), JSON.stringify(event));
}
