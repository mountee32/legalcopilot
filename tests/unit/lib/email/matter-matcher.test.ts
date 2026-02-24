/**
 * Tests for matter matcher
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockTransaction } from "@tests/helpers/mocks";

describe("matter-matcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("matchEmailToMatter", () => {
    it("matches by subject reference with MAT-XXXX-NNN pattern", async () => {
      const { matchEmailToMatter } = await import("@/lib/email/matter-matcher");

      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: "matter-123" }]),
      };

      const result = await matchEmailToMatter(
        "firm-1",
        {
          fromAddress: "someone@example.com",
          subject: "RE: MAT-DEMO-001 — Search results enclosed",
        },
        mockTx
      );

      expect(result).not.toBeNull();
      expect(result!.method).toBe("subject_reference");
      expect(result!.confidence).toBe(98);
      expect(result!.matterId).toBe("matter-123");
    });

    it("matches by sender domain via client email lookup", async () => {
      const { matchEmailToMatter } = await import("@/lib/email/matter-matcher");

      let callCount = 0;
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(() => {
          callCount++;
          // Subject has no MAT-XXXX pattern so subject_reference never calls DB.
          // Call 1: sender_domain client email lookup
          if (callCount === 1) return Promise.resolve([{ id: "client-1" }]);
          // Call 2: active matters for client
          if (callCount === 2) return Promise.resolve([{ id: "matter-456" }]);
          return Promise.resolve([]);
        }),
      };

      const result = await matchEmailToMatter(
        "firm-1",
        {
          fromAddress: "john@acme.com",
          subject: "Updated projections",
        },
        mockTx
      );

      expect(result).not.toBeNull();
      expect(result!.method).toBe("sender_domain");
      expect(result!.confidence).toBe(85); // single active matter
      expect(result!.matterId).toBe("matter-456");
    });

    it("returns lower confidence when multiple active matters for sender", async () => {
      const { matchEmailToMatter } = await import("@/lib/email/matter-matcher");

      let callCount = 0;
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(() => {
          callCount++;
          // Subject "Hello" has no MAT pattern, so subject_reference skips DB call
          if (callCount === 1) return Promise.resolve([{ id: "client-1" }]);
          if (callCount === 2) return Promise.resolve([{ id: "matter-1" }, { id: "matter-2" }]); // multiple
          return Promise.resolve([]);
        }),
      };

      const result = await matchEmailToMatter(
        "firm-1",
        { fromAddress: "john@acme.com", subject: "Hello" },
        mockTx
      );

      expect(result).not.toBeNull();
      expect(result!.confidence).toBe(70);
    });

    it("returns null when no match found", async () => {
      const { matchEmailToMatter } = await import("@/lib/email/matter-matcher");

      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      const result = await matchEmailToMatter(
        "firm-1",
        {
          fromAddress: "unknown@random.com",
          subject: "General enquiry",
        },
        mockTx
      );

      expect(result).toBeNull();
    });

    it("short-circuits on subject reference match without trying sender domain", async () => {
      const { matchEmailToMatter } = await import("@/lib/email/matter-matcher");

      let selectCallCount = 0;
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(() => {
          selectCallCount++;
          if (selectCallCount === 1) return Promise.resolve([{ id: "matter-ref" }]); // subject ref found
          return Promise.resolve([]);
        }),
      };

      const result = await matchEmailToMatter(
        "firm-1",
        {
          fromAddress: "known@client.com",
          subject: "RE: MAT-2024-123 Important update",
        },
        mockTx
      );

      expect(result!.method).toBe("subject_reference");
      // Only 1 DB call made (subject ref), not 3 (would also include sender domain)
      expect(selectCallCount).toBe(1);
    });

    it("handles case-insensitive MAT reference in subject", async () => {
      const { matchEmailToMatter } = await import("@/lib/email/matter-matcher");

      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: "matter-lower" }]),
      };

      const result = await matchEmailToMatter(
        "firm-1",
        { fromAddress: "test@test.com", subject: "About mat-demo-001 files" },
        mockTx
      );

      expect(result).not.toBeNull();
      expect(result!.method).toBe("subject_reference");
    });

    it("returns null when subject has reference pattern but matter not found in DB", async () => {
      const { matchEmailToMatter } = await import("@/lib/email/matter-matcher");

      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]), // nothing found anywhere
      };

      const result = await matchEmailToMatter(
        "firm-1",
        {
          fromAddress: "unknown@random.com",
          subject: "RE: MAT-NONEXISTENT-999 hello",
        },
        mockTx
      );

      expect(result).toBeNull();
    });

    it("returns null when sender client found but no active matters", async () => {
      const { matchEmailToMatter } = await import("@/lib/email/matter-matcher");

      let callCount = 0;
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(() => {
          callCount++;
          // Subject "Hey" has no MAT pattern, so subject_reference skips DB call
          if (callCount === 1) return Promise.resolve([{ id: "client-1" }]); // client found
          if (callCount === 2) return Promise.resolve([]); // no active matters
          return Promise.resolve([]);
        }),
      };

      const result = await matchEmailToMatter(
        "firm-1",
        { fromAddress: "john@dormant-client.com", subject: "Hey" },
        mockTx
      );

      expect(result).toBeNull();
    });
  });
});
