import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { matters, clients, documents } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler } from "@/middleware/withErrorHandler";

interface MatterSearchResult {
  id: string;
  reference: string;
  title: string;
  clientName: string;
  stage: string;
  practiceArea: string;
  snippet?: string;
}

interface ClientSearchResult {
  id: string;
  name: string;
  email: string;
  type: "individual" | "company";
  activeMatters: number;
  snippet?: string;
}

interface DocumentSearchResult {
  id: string;
  filename: string;
  matterId: string;
  matterReference: string;
  uploadedAt: string;
  snippet?: string;
  score: number;
}

export const GET = withErrorHandler(
  withAuth(
    withPermission("matters:read")(async (request, { user }) => {
      const url = new URL(request.url);
      const query = url.searchParams.get("q")?.trim() || "";

      // Require minimum 2 characters
      if (query.length < 2) {
        return NextResponse.json({
          matters: [],
          clients: [],
          documents: [],
          query,
          totalResults: 0,
        });
      }

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const searchTerm = `%${query}%`;

      const results = await withFirmDb(firmId, async (tx) => {
        // Search matters
        const matterResults = await tx
          .select({
            id: matters.id,
            reference: matters.reference,
            title: matters.title,
            status: matters.status,
            practiceArea: matters.practiceArea,
            clientId: matters.clientId,
            description: matters.description,
          })
          .from(matters)
          .leftJoin(clients, eq(matters.clientId, clients.id))
          .where(
            and(
              eq(matters.firmId, firmId),
              or(
                ilike(matters.reference, searchTerm),
                ilike(matters.title, searchTerm),
                ilike(matters.description, searchTerm)
              )
            )
          )
          .limit(5);

        // Get client names for matters
        const clientIds = matterResults.map((m) => m.clientId);
        const clientsForMatters = clientIds.length
          ? await tx
              .select({
                id: clients.id,
                firstName: clients.firstName,
                lastName: clients.lastName,
                companyName: clients.companyName,
              })
              .from(clients)
              .where(
                and(
                  eq(clients.firmId, firmId),
                  sql`${clients.id} IN ${sql.raw(`(${clientIds.map(() => "?").join(",")})`, clientIds)}`
                )
              )
          : [];

        const clientMap = new Map(
          clientsForMatters.map((c) => [
            c.id,
            c.companyName || `${c.firstName || ""} ${c.lastName || ""}`.trim(),
          ])
        );

        const formattedMatters: MatterSearchResult[] = matterResults.map((m) => ({
          id: m.id,
          reference: m.reference,
          title: m.title,
          clientName: clientMap.get(m.clientId) || "Unknown Client",
          stage: m.status || "unknown",
          practiceArea: m.practiceArea || "other",
          snippet: m.description || undefined,
        }));

        // Search clients
        const clientResults = await tx
          .select({
            id: clients.id,
            firstName: clients.firstName,
            lastName: clients.lastName,
            companyName: clients.companyName,
            email: clients.email,
            type: clients.type,
            notes: clients.notes,
          })
          .from(clients)
          .where(
            and(
              eq(clients.firmId, firmId),
              or(
                ilike(clients.firstName, searchTerm),
                ilike(clients.lastName, searchTerm),
                ilike(clients.companyName, searchTerm),
                ilike(clients.email, searchTerm)
              )
            )
          )
          .limit(5);

        // Count active matters for each client
        const clientIdsForCount = clientResults.map((c) => c.id);
        const matterCounts = clientIdsForCount.length
          ? await tx
              .select({
                clientId: matters.clientId,
                count: sql<number>`count(*)`,
              })
              .from(matters)
              .where(
                and(
                  eq(matters.firmId, firmId),
                  eq(matters.status, "active"),
                  sql`${matters.clientId} IN ${sql.raw(`(${clientIdsForCount.map(() => "?").join(",")})`, clientIdsForCount)}`
                )
              )
              .groupBy(matters.clientId)
          : [];

        const matterCountMap = new Map(matterCounts.map((mc) => [mc.clientId, Number(mc.count)]));

        const formattedClients: ClientSearchResult[] = clientResults.map((c) => ({
          id: c.id,
          name: c.companyName || `${c.firstName || ""} ${c.lastName || ""}`.trim(),
          email: c.email || "",
          type: (c.type || "individual") as "individual" | "company",
          activeMatters: matterCountMap.get(c.id) || 0,
          snippet: c.notes || undefined,
        }));

        // Search documents
        const documentResults = await tx
          .select({
            id: documents.id,
            filename: documents.filename,
            matterId: documents.matterId,
            title: documents.title,
            extractedText: documents.extractedText,
            createdAt: documents.createdAt,
          })
          .from(documents)
          .where(
            and(
              eq(documents.firmId, firmId),
              or(
                ilike(documents.filename, searchTerm),
                ilike(documents.title, searchTerm),
                ilike(documents.extractedText, searchTerm)
              )
            )
          )
          .limit(5);

        // Get matter references for documents
        const matterIdsForDocs = documentResults.map((d) => d.matterId);
        const mattersForDocs = matterIdsForDocs.length
          ? await tx
              .select({
                id: matters.id,
                reference: matters.reference,
              })
              .from(matters)
              .where(
                and(
                  eq(matters.firmId, firmId),
                  sql`${matters.id} IN ${sql.raw(`(${matterIdsForDocs.map(() => "?").join(",")})`, matterIdsForDocs)}`
                )
              )
          : [];

        const matterRefMap = new Map(mattersForDocs.map((m) => [m.id, m.reference]));

        const formattedDocuments: DocumentSearchResult[] = documentResults.map((d, idx) => ({
          id: d.id,
          filename: d.filename || d.title || "Untitled",
          matterId: d.matterId,
          matterReference: matterRefMap.get(d.matterId) || "Unknown",
          uploadedAt: d.createdAt?.toISOString() || new Date().toISOString(),
          snippet: d.extractedText?.substring(0, 200) || undefined,
          score: 1.0 - idx * 0.1, // Simple scoring based on order
        }));

        return {
          matters: formattedMatters,
          clients: formattedClients,
          documents: formattedDocuments,
        };
      });

      const totalResults =
        results.matters.length + results.clients.length + results.documents.length;

      return NextResponse.json({
        ...results,
        query,
        totalResults,
      });
    })
  )
);
