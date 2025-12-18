import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { matters, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { withClientPortalAuth, verifyClientMatterAccess } from "@/middleware/withClientPortalAuth";

/**
 * GET /api/portal/matters/[id]
 *
 * Get detailed information about a specific matter.
 * Verifies client owns the matter before returning data.
 *
 * @requires Portal session authentication
 * @param id - Matter UUID
 * @returns Matter details with fee earner information
 */
export const GET = withClientPortalAuth(async (request, { params, portalSession }) => {
  try {
    // Await params if it's a promise (Next.js 15 compatibility)
    const resolvedParams = await Promise.resolve(params);
    const matterId = resolvedParams?.id;

    if (!matterId) {
      return NextResponse.json({ error: "Matter ID is required" }, { status: 400 });
    }

    // Verify client has access to this matter
    const hasAccess = await verifyClientMatterAccess(portalSession.clientId, matterId);

    if (!hasAccess) {
      return NextResponse.json({ error: "Matter not found or access denied" }, { status: 404 });
    }

    // Fetch matter with fee earner details
    const matterResult = await db
      .select({
        matter: matters,
        feeEarner: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(matters)
      .leftJoin(users, eq(matters.feeEarnerId, users.id))
      .where(and(eq(matters.id, matterId), eq(matters.clientId, portalSession.clientId)))
      .limit(1);

    if (!matterResult || matterResult.length === 0) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    const { matter, feeEarner } = matterResult[0];

    // Exclude sensitive internal fields
    const { firmId, supervisorId, riskScore, riskFactors, riskAssessedAt, notes, ...publicMatter } =
      matter;

    return NextResponse.json({
      success: true,
      matter: {
        ...publicMatter,
        feeEarner: feeEarner || null,
      },
    });
  } catch (error) {
    console.error("Error fetching matter details:", error);
    return NextResponse.json({ error: "Failed to fetch matter details" }, { status: 500 });
  }
});
