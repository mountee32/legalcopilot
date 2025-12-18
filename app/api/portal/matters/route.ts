import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { matters } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { withClientPortalAuth } from "@/middleware/withClientPortalAuth";

/**
 * GET /api/portal/matters
 *
 * List all matters for the authenticated client.
 * Only returns matters belonging to the client's account.
 *
 * @requires Portal session authentication
 * @returns Array of matters
 */
export const GET = withClientPortalAuth(async (request, { portalSession }) => {
  try {
    // Fetch all matters for this client
    const clientMatters = await db
      .select({
        id: matters.id,
        reference: matters.reference,
        title: matters.title,
        description: matters.description,
        status: matters.status,
        practiceArea: matters.practiceArea,
        billingType: matters.billingType,
        openedAt: matters.openedAt,
        closedAt: matters.closedAt,
        keyDeadline: matters.keyDeadline,
        createdAt: matters.createdAt,
        updatedAt: matters.updatedAt,
      })
      .from(matters)
      .where(eq(matters.clientId, portalSession.clientId))
      .orderBy(desc(matters.createdAt));

    return NextResponse.json({
      success: true,
      matters: clientMatters,
      count: clientMatters.length,
    });
  } catch (error) {
    console.error("Error fetching client matters:", error);
    return NextResponse.json({ error: "Failed to fetch matters" }, { status: 500 });
  }
});
