/**
 * Tests for Generation Context Builder
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database and schema
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema", () => ({
  matters: { id: "id", firmId: "firm_id", clientId: "client_id", feeEarnerId: "fee_earner_id" },
  clients: { id: "id" },
  firms: { id: "id" },
  users: { id: "id", name: "name", email: "email" },
  pipelineFindings: {
    id: "id",
    matterId: "matter_id",
    firmId: "firm_id",
    createdAt: "created_at",
    fieldKey: "field_key",
    label: "label",
    value: "value",
    confidence: "confidence",
    impact: "impact",
    status: "status",
    sourceQuote: "source_quote",
    categoryKey: "category_key",
    pageStart: "page_start",
    pageEnd: "page_end",
  },
}));

// Mock drizzle orm
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: any[]) => ({ type: "eq", args })),
  and: vi.fn((...args: any[]) => ({ type: "and", args })),
  desc: vi.fn((col: any) => ({ type: "desc", col })),
}));

vi.mock("@/middleware/withErrorHandler", () => ({
  NotFoundError: class NotFoundError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "NotFoundError";
    }
  },
}));

const mockMatter = {
  id: "matter-1",
  firmId: "firm-1",
  reference: "MAT-001",
  title: "Test Matter",
  practiceArea: "personal_injury",
  status: "active",
  description: "Test description",
  subType: "rta",
  clientId: "client-1",
  feeEarnerId: "user-1",
};

const mockClient = {
  id: "client-1",
  type: "individual",
  firstName: "John",
  lastName: "Smith",
  companyName: null,
  email: "john@example.com",
  phone: "555-1234",
  addressLine1: "123 Main St",
  addressLine2: null,
  city: "Manchester",
  county: "Greater Manchester",
  postcode: "M1 1AA",
};

const mockFirm = { id: "firm-1", name: "Harrison & Clarke Solicitors" };

const mockUser = { name: "James Clarke", email: "james@firm.com" };

const mockFindings = [
  {
    id: "f-1",
    fieldKey: "plaintiff_name",
    label: "Plaintiff Name",
    value: "John Smith",
    confidence: "95",
    impact: "high",
    status: "accepted",
    sourceQuote: "Mr. John Smith...",
    categoryKey: "parties",
    pageStart: 1,
    pageEnd: 1,
    createdAt: new Date("2025-01-02"),
  },
  {
    id: "f-2",
    fieldKey: "incident_date",
    label: "Incident Date",
    value: "2024-06-15",
    confidence: "90",
    impact: "medium",
    status: "pending",
    sourceQuote: null,
    categoryKey: "incident",
    pageStart: 2,
    pageEnd: 2,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "f-3",
    fieldKey: "plaintiff_name",
    label: "Plaintiff Name",
    value: "J. Smith",
    confidence: "80",
    impact: "high",
    status: "pending",
    sourceQuote: null,
    categoryKey: "parties",
    pageStart: 3,
    pageEnd: 3,
    createdAt: new Date("2024-12-30"),
  },
];

function createMockTx(options: {
  matter?: any;
  client?: any;
  firm?: any;
  user?: any;
  findings?: any[];
}) {
  const callCounts = { select: 0 };
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => {
          callCounts.select++;
          if (callCounts.select === 1) return options.matter ? [options.matter] : [];
          if (callCounts.select === 2) return options.client ? [options.client] : [];
          if (callCounts.select === 3) return options.firm ? [options.firm] : [];
          if (callCounts.select === 4) return options.user ? [options.user] : [];
          return [];
        }),
        orderBy: vi.fn().mockReturnValue({
          // This is for findings which have where -> orderBy
        }),
      }),
    }),
  } as any;
}

// Specialized mock that handles the findings query chain properly
function createFullMockTx(options: {
  matter?: any;
  client?: any;
  firm?: any;
  user?: any;
  findings?: any[];
}) {
  let selectCall = 0;
  const tx: any = {
    select: vi.fn().mockImplementation(() => {
      selectCall++;
      const currentCall = selectCall;
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            if (currentCall === 5) {
              // Findings query: has orderBy after where
              return {
                orderBy: vi.fn().mockResolvedValue(options.findings || []),
              };
            }
            // Regular queries (matter, client, firm, user)
            if (currentCall === 1) return options.matter ? [options.matter] : [];
            if (currentCall === 2) return options.client ? [options.client] : [];
            if (currentCall === 3) return options.firm ? [options.firm] : [];
            if (currentCall === 4) return options.user ? [options.user] : [];
            return [];
          }),
        }),
      };
    }),
  };
  return tx;
}

describe("buildGenerationContext", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should build context from matter + client + findings", async () => {
    const { buildGenerationContext } = await import("@/lib/generation/context-builder");
    const tx = createFullMockTx({
      matter: mockMatter,
      client: mockClient,
      firm: mockFirm,
      user: mockUser,
      findings: mockFindings,
    });

    const ctx = await buildGenerationContext("firm-1", "matter-1", tx);

    expect(ctx.matter.reference).toBe("MAT-001");
    expect(ctx.matter.title).toBe("Test Matter");
    expect(ctx.client.name).toBe("John Smith");
    expect(ctx.firm.name).toBe("Harrison & Clarke Solicitors");
    expect(ctx.feeEarner).toEqual({ name: "James Clarke", email: "james@firm.com" });
    expect(ctx.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("should flatten findings by fieldKey (latest value wins)", async () => {
    const { buildGenerationContext } = await import("@/lib/generation/context-builder");
    const tx = createFullMockTx({
      matter: mockMatter,
      client: mockClient,
      firm: mockFirm,
      user: mockUser,
      findings: mockFindings,
    });

    const ctx = await buildGenerationContext("firm-1", "matter-1", tx);

    // The first occurrence (newest) should win
    expect(ctx.findings["plaintiff_name"]).toBe("John Smith");
    expect(ctx.findings["incident_date"]).toBe("2024-06-15");
  });

  it("should group findings by category", async () => {
    const { buildGenerationContext } = await import("@/lib/generation/context-builder");
    const tx = createFullMockTx({
      matter: mockMatter,
      client: mockClient,
      firm: mockFirm,
      user: mockUser,
      findings: mockFindings,
    });

    const ctx = await buildGenerationContext("firm-1", "matter-1", tx);

    expect(ctx.findingsByCategory["parties"]).toHaveLength(2);
    expect(ctx.findingsByCategory["incident"]).toHaveLength(1);
  });

  it("should compute correct client name for company type", async () => {
    const { buildGenerationContext } = await import("@/lib/generation/context-builder");
    const companyClient = {
      ...mockClient,
      type: "company",
      companyName: "Acme Corp Ltd",
      firstName: null,
      lastName: null,
    };
    const tx = createFullMockTx({
      matter: mockMatter,
      client: companyClient,
      firm: mockFirm,
      user: mockUser,
      findings: [],
    });

    const ctx = await buildGenerationContext("firm-1", "matter-1", tx);
    expect(ctx.client.name).toBe("Acme Corp Ltd");
  });

  it("should throw NotFoundError for missing matter", async () => {
    const { buildGenerationContext } = await import("@/lib/generation/context-builder");
    const tx = createFullMockTx({
      matter: null,
      client: null,
      firm: null,
      user: null,
      findings: [],
    });

    await expect(buildGenerationContext("firm-1", "missing", tx)).rejects.toThrow(
      "Matter not found"
    );
  });
});
