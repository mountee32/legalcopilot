import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike, or } from "drizzle-orm";
import { clients, conflictChecks, matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { ConflictSearchRequestSchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const POST = withErrorHandler(
  withAuth(
    withPermission("conflicts:read")(async (request: NextRequest, { user }) => {
      const body = await request.json().catch(() => ({}));
      const data = ConflictSearchRequestSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        const [matter] = await tx
          .select({ id: matters.id })
          .from(matters)
          .where(and(eq(matters.id, data.matterId), eq(matters.firmId, firmId)))
          .limit(1);
        if (!matter) throw new NotFoundError("Matter not found");

        const term = `%${data.search}%`;
        const matchingClients = await tx
          .select({
            id: clients.id,
            reference: clients.reference,
            firstName: clients.firstName,
            lastName: clients.lastName,
            companyName: clients.companyName,
            email: clients.email,
          })
          .from(clients)
          .where(
            and(
              eq(clients.firmId, firmId),
              or(
                ilike(clients.reference, term),
                ilike(clients.firstName, term),
                ilike(clients.lastName, term),
                ilike(clients.companyName, term),
                ilike(clients.email, term)
              )!
            )
          )
          .limit(25);

        const matchingMatters = await tx
          .select({ id: matters.id, reference: matters.reference, title: matters.title })
          .from(matters)
          .where(
            and(
              eq(matters.firmId, firmId),
              or(ilike(matters.reference, term), ilike(matters.title, term))!
            )
          )
          .limit(25);

        const matches = [
          ...matchingClients.map((c) => ({ type: "client", ...c })),
          ...matchingMatters.map((m) => ({ type: "matter", ...m })),
        ];

        const [existing] = await tx
          .select()
          .from(conflictChecks)
          .where(and(eq(conflictChecks.firmId, firmId), eq(conflictChecks.matterId, data.matterId)))
          .limit(1);

        const searchTerms = { query: data.search, at: new Date().toISOString() };
        const results = { matches };

        const row = existing
          ? await tx
              .update(conflictChecks)
              .set({ searchTerms, results, status: "pending", updatedAt: new Date() })
              .where(and(eq(conflictChecks.id, existing.id), eq(conflictChecks.firmId, firmId)))
              .returning()
              .then((r) => r[0] ?? null)
          : await tx
              .insert(conflictChecks)
              .values({
                firmId,
                matterId: data.matterId,
                searchTerms,
                results,
                status: "pending",
                createdById: user.user.id,
                updatedAt: new Date(),
              })
              .returning()
              .then((r) => r[0] ?? null);

        if (row) {
          await createTimelineEvent(tx, {
            firmId,
            matterId: data.matterId,
            type: "conflict_check_run",
            title: "Conflict check run",
            actorType: "user",
            actorId: user.user.id,
            entityType: "conflict_check",
            entityId: row.id,
            occurredAt: new Date(),
            metadata: { query: data.search, matchCount: matches.length },
          });
        }

        return { conflictCheck: row, matches };
      });

      return NextResponse.json({ success: true, ...result });
    })
  )
);
