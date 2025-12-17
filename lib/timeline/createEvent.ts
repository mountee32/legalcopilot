import { timelineEvents, type NewTimelineEvent } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { publishMatterEvent } from "@/lib/realtime/publish";

export async function createTimelineEvent(
  tx: typeof db,
  event: Omit<NewTimelineEvent, "id" | "createdAt">
) {
  const [row] = await tx
    .insert(timelineEvents)
    .values({
      ...event,
      description: event.description ?? null,
      actorId: event.actorId ?? null,
      entityType: event.entityType ?? null,
      entityId: event.entityId ?? null,
      metadata: event.metadata ?? null,
    })
    .returning();

  publishMatterEvent(event.firmId, event.matterId, "timeline:event", {
    timelineEventId: row.id,
    type: row.type,
    occurredAt:
      row.occurredAt instanceof Date ? row.occurredAt.toISOString() : String(row.occurredAt),
  }).catch(() => {});

  return row;
}
