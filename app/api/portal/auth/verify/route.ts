import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientPortalTokens, clientPortalSessions } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "crypto";

/**
 * POST /api/portal/auth/verify
 *
 * Verify a magic link token and create a portal session.
 * Consumes the one-time token and returns a long-lived session token.
 *
 * @body token - Magic link token from email
 * @returns Session token and client information
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Look up valid, unused token
    const tokenResult = await db
      .select()
      .from(clientPortalTokens)
      .where(
        and(
          eq(clientPortalTokens.token, token),
          eq(clientPortalTokens.status, "pending"),
          gt(clientPortalTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!tokenResult || tokenResult.length === 0) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const portalToken = tokenResult[0];

    // Get request IP for audit trail
    const ipAddress =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    const userAgent = request.headers.get("user-agent") || "unknown";

    // Mark token as used
    await db
      .update(clientPortalTokens)
      .set({
        status: "used",
        usedAt: new Date(),
        useIpAddress: ipAddress,
      })
      .where(eq(clientPortalTokens.id, portalToken.id));

    // Generate session token (32 bytes = 64 hex characters)
    const sessionToken = randomBytes(32).toString("hex");

    // Session expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create session
    const sessionResult = await db
      .insert(clientPortalSessions)
      .values({
        firmId: portalToken.firmId,
        clientId: portalToken.clientId,
        token: sessionToken,
        expiresAt,
        ipAddress,
        userAgent,
      })
      .returning();

    const session = sessionResult[0];

    return NextResponse.json({
      success: true,
      sessionToken,
      expiresAt: session.expiresAt.toISOString(),
      clientId: session.clientId,
    });
  } catch (error) {
    console.error("Error verifying portal token:", error);
    return NextResponse.json({ error: "Failed to verify token" }, { status: 500 });
  }
}
