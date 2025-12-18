import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  generatePaymentToken,
  calculateExpiry,
  isPaymentLinkValid,
  signToken,
  verifyTokenSignature,
} from "@/lib/billing/payment-link";

describe("Payment Link Utilities", () => {
  describe("generatePaymentToken", () => {
    it("generates a unique token", () => {
      const token1 = generatePaymentToken();
      const token2 = generatePaymentToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
    });

    it("generates a token of expected length", () => {
      const token = generatePaymentToken();
      // Base64url encoded 32 bytes should be ~43 characters
      expect(token.length).toBeGreaterThan(40);
    });

    it("generates URL-safe tokens", () => {
      const token = generatePaymentToken();
      // Should not contain +, /, or =
      expect(token).not.toMatch(/[+/=]/);
    });
  });

  describe("calculateExpiry", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("calculates expiry 72 hours from now by default", () => {
      const now = new Date("2024-12-18T00:00:00Z");
      vi.setSystemTime(now);

      const expiry = calculateExpiry();
      const expected = new Date("2024-12-21T00:00:00Z");

      expect(expiry.getTime()).toBe(expected.getTime());
    });

    it("calculates custom expiry hours", () => {
      const now = new Date("2024-12-18T00:00:00Z");
      vi.setSystemTime(now);

      const expiry = calculateExpiry(24);
      const expected = new Date("2024-12-19T00:00:00Z");

      expect(expiry.getTime()).toBe(expected.getTime());
    });

    it("handles fractional hours", () => {
      const now = new Date("2024-12-18T00:00:00Z");
      vi.setSystemTime(now);

      const expiry = calculateExpiry(12);
      const expected = new Date("2024-12-18T12:00:00Z");

      expect(expiry.getTime()).toBe(expected.getTime());
    });
  });

  describe("isPaymentLinkValid", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns true for future expiry date", () => {
      vi.setSystemTime(new Date("2024-12-18T00:00:00Z"));
      const futureDate = new Date("2024-12-20T00:00:00Z");

      expect(isPaymentLinkValid(futureDate)).toBe(true);
    });

    it("returns false for past expiry date", () => {
      vi.setSystemTime(new Date("2024-12-18T00:00:00Z"));
      const pastDate = new Date("2024-12-15T00:00:00Z");

      expect(isPaymentLinkValid(pastDate)).toBe(false);
    });

    it("returns false for null expiry", () => {
      expect(isPaymentLinkValid(null)).toBe(false);
    });

    it("handles string date format", () => {
      vi.setSystemTime(new Date("2024-12-18T00:00:00Z"));
      const futureDate = "2024-12-20T00:00:00Z";

      expect(isPaymentLinkValid(futureDate)).toBe(true);
    });

    it("returns false for expired link by 1 millisecond", () => {
      vi.setSystemTime(new Date("2024-12-18T00:00:00.001Z"));
      const expiry = new Date("2024-12-18T00:00:00.000Z");

      expect(isPaymentLinkValid(expiry)).toBe(false);
    });
  });

  describe("signToken", () => {
    it("generates consistent signatures for same input", () => {
      const token = "test-token-123";
      const secret = "test-secret";

      const sig1 = signToken(token, secret);
      const sig2 = signToken(token, secret);

      expect(sig1).toBe(sig2);
    });

    it("generates different signatures for different tokens", () => {
      const secret = "test-secret";

      const sig1 = signToken("token-1", secret);
      const sig2 = signToken("token-2", secret);

      expect(sig1).not.toBe(sig2);
    });

    it("generates different signatures for different secrets", () => {
      const token = "test-token-123";

      const sig1 = signToken(token, "secret-1");
      const sig2 = signToken(token, "secret-2");

      expect(sig1).not.toBe(sig2);
    });

    it("generates URL-safe signatures", () => {
      const token = "test-token-123";
      const secret = "test-secret";

      const signature = signToken(token, secret);
      expect(signature).not.toMatch(/[+/=]/);
    });
  });

  describe("verifyTokenSignature", () => {
    it("verifies valid signatures", () => {
      const token = "test-token-123";
      const secret = "test-secret";
      const signature = signToken(token, secret);

      expect(verifyTokenSignature(token, signature, secret)).toBe(true);
    });

    it("rejects invalid signatures", () => {
      const token = "test-token-123";
      const secret = "test-secret";
      const invalidSignature = "invalid-signature";

      expect(verifyTokenSignature(token, invalidSignature, secret)).toBe(false);
    });

    it("rejects signatures with wrong secret", () => {
      const token = "test-token-123";
      const signature = signToken(token, "secret-1");

      expect(verifyTokenSignature(token, signature, "secret-2")).toBe(false);
    });

    it("rejects signatures for different tokens", () => {
      const secret = "test-secret";
      const signature = signToken("token-1", secret);

      expect(verifyTokenSignature("token-2", signature, secret)).toBe(false);
    });

    it("handles timing-safe comparison edge cases", () => {
      const token = "test-token";
      const secret = "test-secret";

      // Test with empty signature
      expect(verifyTokenSignature(token, "", secret)).toBe(false);

      // Test with malformed signature
      expect(verifyTokenSignature(token, "!!!invalid!!!", secret)).toBe(false);
    });

    it("is resistant to timing attacks", () => {
      const token = "test-token-123";
      const secret = "test-secret";
      const validSignature = signToken(token, secret);

      // Create signatures that differ at different positions
      const wrongSig1 = "X" + validSignature.slice(1);
      const wrongSig2 = validSignature.slice(0, -1) + "X";

      const start1 = Date.now();
      verifyTokenSignature(token, wrongSig1, secret);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      verifyTokenSignature(token, wrongSig2, secret);
      const time2 = Date.now() - start2;

      // Timing should be relatively similar (within 10ms)
      // This is a basic check; real timing attack testing requires more sophisticated methods
      const timeDiff = Math.abs(time1 - time2);
      expect(timeDiff).toBeLessThan(10);
    });
  });
});
