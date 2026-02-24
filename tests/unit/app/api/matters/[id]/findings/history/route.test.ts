import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/matters/[id]/findings/history/route";

// --- standard mocks ---
vi.mock("@/middleware/withAuth", () => ({
  withAuth: (fn: Function) => fn,
}));
vi.mock("@/middleware/withErrorHandler", () => ({
  withErrorHandler: (fn: Function) => fn,
  NotFoundError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "NotFoundError";
    }
  },
  ValidationError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "ValidationError";
    }
  },
}));
vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn().mockResolvedValue("firm-1"),
}));

import * as tenantModule from "@/lib/db/tenant";
vi.mock("@/lib/db/tenant");
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema", () => ({
  pipelineFindings: {
    matterId: "matterId",
    firmId: "firmId",
    fieldKey: "fieldKey",
    categoryKey: "categoryKey",
    pipelineRunId: "pipelineRunId",
    documentId: "documentId",
  },
  pipelineRuns: { id: "id", status: "status", classifiedDocType: "classifiedDocType" },
  documents: { id: "id", filename: "filename" },
  matters: { id: "id", firmId: "firmId" },
}));

const mockUser = { user: { id: "user-1" } };

describe("GET /api/matters/[id]/findings/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns finding history for a field", async () => {
    const historyData = [
      {
        id: "f-1",
        value: "John Smith",
        confidence: "0.950",
        status: "accepted",
        createdAt: new Date(),
      },
      {
        id: "f-2",
        value: "Jon Smith",
        confidence: "0.800",
        status: "rejected",
        createdAt: new Date(),
      },
    ];

    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      return historyData;
    });

    const request = new Request(
      "http://localhost/api/matters/m-1/findings/history?fieldKey=plaintiff_name&categoryKey=plaintiff_info"
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: "m-1" }),
      user: mockUser,
    } as any);
    const data = await response.json();

    expect(data.fieldKey).toBe("plaintiff_name");
    expect(data.categoryKey).toBe("plaintiff_info");
    expect(data.totalEntries).toBe(2);
    expect(data.history).toHaveLength(2);
  });

  it("requires fieldKey parameter", async () => {
    const request = new Request("http://localhost/api/matters/m-1/findings/history");

    try {
      await GET(request, { params: Promise.resolve({ id: "m-1" }), user: mockUser } as any);
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.name).toBe("ValidationError");
    }
  });
});
