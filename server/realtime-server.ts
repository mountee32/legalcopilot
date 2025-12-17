import http from "http";
import { WebSocketServer, type WebSocket } from "ws";
import { auth } from "@/lib/auth";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withFirmDb } from "@/lib/db/tenant";
import { matters } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getRedis } from "@/lib/redis";
import { firmChannel, matterChannel } from "@/lib/realtime/channels";

type ClientContext = {
  userId: string;
  firmId: string;
  matterIds: Set<string>;
};

function headersFromNode(req: http.IncomingMessage): Headers {
  const h = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") h.set(key, value);
    else if (Array.isArray(value)) h.set(key, value.join(","));
  }
  return h;
}

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

async function resolveFirmIdForSocket(userId: string): Promise<string> {
  return await getOrCreateFirmIdForUser(userId);
}

async function matterBelongsToFirm(firmId: string, matterId: string): Promise<boolean> {
  const row = await withFirmDb(firmId, async (tx) => {
    const [m] = await tx
      .select({ id: matters.id })
      .from(matters)
      .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
      .limit(1);
    return m ?? null;
  });
  return !!row;
}

const firmSockets = new Map<string, Set<WebSocket>>();
const matterSockets = new Map<string, Set<WebSocket>>();
const contexts = new WeakMap<WebSocket, ClientContext>();

function addToMap(map: Map<string, Set<WebSocket>>, key: string, ws: WebSocket) {
  const set = map.get(key) ?? new Set<WebSocket>();
  set.add(ws);
  map.set(key, set);
}

function removeFromMap(map: Map<string, Set<WebSocket>>, key: string, ws: WebSocket) {
  const set = map.get(key);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) map.delete(key);
}

function broadcast(map: Map<string, Set<WebSocket>>, key: string, data: string) {
  const set = map.get(key);
  if (!set) return;
  for (const ws of set) {
    if (ws.readyState === ws.OPEN) ws.send(data);
  }
}

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("LegalCopilot realtime server\n");
});

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", async (ws, req) => {
  try {
    const session = await auth.api.getSession({ headers: headersFromNode(req) });
    if (!session?.user?.id) {
      ws.close(4401, "Unauthorized");
      return;
    }

    const userId = session.user.id;
    const firmId = await resolveFirmIdForSocket(userId);

    contexts.set(ws, { userId, firmId, matterIds: new Set() });
    addToMap(firmSockets, firmId, ws);

    ws.send(
      JSON.stringify({
        type: "connected",
        firmId,
        rooms: { firm: firmChannel(firmId) },
      })
    );

    ws.on("message", async (raw) => {
      const msg = safeJsonParse<any>(raw.toString());
      if (!msg || typeof msg?.type !== "string") return;

      const ctx = contexts.get(ws);
      if (!ctx) return;

      if (msg.type === "subscribe" && typeof msg.matterId === "string") {
        const matterId = msg.matterId;
        if (ctx.matterIds.has(matterId)) return;
        const allowed = await matterBelongsToFirm(ctx.firmId, matterId);
        if (!allowed) return;

        ctx.matterIds.add(matterId);
        addToMap(matterSockets, matterId, ws);

        ws.send(
          JSON.stringify({
            type: "subscribed",
            matterId,
            room: matterChannel(matterId),
          })
        );
      }
    });

    ws.on("close", () => {
      const ctx = contexts.get(ws);
      if (!ctx) return;
      removeFromMap(firmSockets, ctx.firmId, ws);
      for (const matterId of ctx.matterIds) removeFromMap(matterSockets, matterId, ws);
    });
  } catch {
    ws.close(1011, "Server error");
  }
});

async function startSubscriber() {
  const redis = getRedis().duplicate();
  await redis.psubscribe("realtime:*");

  redis.on("pmessage", (_pattern, channel, message) => {
    if (channel.startsWith("realtime:firm:")) {
      const firmId = channel.slice("realtime:firm:".length);
      broadcast(firmSockets, firmId, message);
      return;
    }
    if (channel.startsWith("realtime:matter:")) {
      const matterId = channel.slice("realtime:matter:".length);
      broadcast(matterSockets, matterId, message);
    }
  });
}

const port = parseInt(process.env.REALTIME_PORT || "3002", 10);
server.listen(port, () => {
  console.log(`✅ Realtime server listening on :${port} (ws path /ws)`);
});

startSubscriber().catch((err) => {
  console.error("❌ Realtime redis subscriber failed:", err);
});
