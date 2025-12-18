import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, clientPortalTokens } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";

/**
 * POST /api/portal/auth/request
 *
 * Request a magic link for client portal access.
 * Generates a secure token and sends it via email to the client.
 *
 * @body email - Client email address
 * @body firmId - Firm ID (for multi-tenant environments)
 * @returns Success message (never reveals whether email exists for security)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firmId } = body;

    if (!email || !firmId) {
      return NextResponse.json({ error: "Email and firmId are required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Look up client by email and firm
    const clientResult = await db
      .select()
      .from(clients)
      .where(and(eq(clients.email, email.toLowerCase()), eq(clients.firmId, firmId)))
      .limit(1);

    // Always return success to prevent email enumeration attacks
    if (!clientResult || clientResult.length === 0) {
      console.warn(`Portal auth requested for non-existent email: ${email}`);
      return NextResponse.json({
        success: true,
        message: "If a client account exists with this email, a magic link has been sent.",
      });
    }

    const client = clientResult[0];

    // Generate secure random token (32 bytes = 64 hex characters)
    const token = randomBytes(32).toString("hex");

    // Token expires in 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Get request IP for audit trail
    const ipAddress =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    // Store token
    await db.insert(clientPortalTokens).values({
      firmId,
      clientId: client.id,
      token,
      email: email.toLowerCase(),
      expiresAt,
      requestIpAddress: ipAddress,
      status: "pending",
    });

    // TODO: Send email with magic link
    // In production, this would integrate with email service:
    // const magicLink = `${process.env.APP_URL}/portal/auth/verify?token=${token}`;
    // await sendEmail({
    //   to: email,
    //   subject: "Your client portal access link",
    //   html: `Click here to access the portal: ${magicLink}`,
    // });

    console.log(`Magic link token generated for client ${client.id}: ${token}`);

    return NextResponse.json({
      success: true,
      message: "If a client account exists with this email, a magic link has been sent.",
      // Include token in response for testing only (remove in production)
      ...(process.env.NODE_ENV !== "production" && { token }),
    });
  } catch (error) {
    console.error("Error requesting portal access:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
