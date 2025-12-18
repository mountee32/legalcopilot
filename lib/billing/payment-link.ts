/**
 * Payment Link Utilities
 *
 * Generate and validate secure payment links for invoices.
 */

import { randomBytes, createHmac, timingSafeEqual } from "crypto";

const TOKEN_LENGTH = 32; // 32 bytes = 256 bits
const DEFAULT_EXPIRY_HOURS = 72; // 3 days

/**
 * Generate a cryptographically secure random token.
 */
export function generatePaymentToken(): string {
  return randomBytes(TOKEN_LENGTH).toString("base64url");
}

/**
 * Calculate expiry timestamp.
 */
export function calculateExpiry(hours: number = DEFAULT_EXPIRY_HOURS): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry;
}

/**
 * Verify if a payment link is still valid.
 */
export function isPaymentLinkValid(expiresAt: Date | string | null): boolean {
  if (!expiresAt) return false;
  const expiry = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return expiry > new Date();
}

/**
 * Sign a payment token with HMAC for additional security.
 * This prevents token tampering and ensures authenticity.
 */
export function signToken(token: string, secret: string): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(token);
  return hmac.digest("base64url");
}

/**
 * Verify a signed token.
 */
export function verifyTokenSignature(token: string, signature: string, secret: string): boolean {
  const expectedSignature = signToken(token, secret);

  // Use timing-safe comparison to prevent timing attacks
  try {
    const expectedBuffer = Buffer.from(expectedSignature);
    const providedBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}
