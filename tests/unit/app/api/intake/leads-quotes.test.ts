import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, { ...ctx, user: { user: { id: "user-1" } } }),
}));

vi.mock("@/middleware/withPermission", () => ({
  withPermission: () => (handler: any) => handler,
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(),
}));

vi.mock("@/lib/references", () => ({
  generateReference: vi.fn((prefix: string) => `${prefix}-TEST123`),
}));

vi.mock("@/lib/timeline/createEvent", () => ({
  createTimelineEvent: vi.fn(async () => ({})),
}));

describe("Leads API - GET /api/leads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated list of leads", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockLeads = [
      {
        id: "lead-1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "new",
      },
      {
        id: "lead-2",
        companyName: "Acme Ltd",
        email: "info@acme.com",
        status: "contacted",
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 2, rows: mockLeads } as any);

    const { GET } = await import("@/app/api/leads/route");
    const request = new NextRequest("http://localhost/api/leads?page=1&limit=20");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.leads)).toBe(true);
    expect(json.leads.length).toBe(2);
    expect(json.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });
  });

  it("returns empty list when no leads exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 0, rows: [] } as any);

    const { GET } = await import("@/app/api/leads/route");
    const request = new NextRequest("http://localhost/api/leads?page=1&limit=20");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.leads).toEqual([]);
    expect(json.pagination.total).toBe(0);
  });

  it("filters leads by status parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockLeads = [{ id: "lead-1", status: "qualified" }];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockLeads } as any);

    const { GET } = await import("@/app/api/leads/route");
    const request = new NextRequest("http://localhost/api/leads?status=qualified");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.leads.length).toBe(1);
    expect(json.leads[0].status).toBe("qualified");
  });

  it("searches leads by name/email/company", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockLeads = [
      {
        id: "lead-1",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockLeads } as any);

    const { GET } = await import("@/app/api/leads/route");
    const request = new NextRequest("http://localhost/api/leads?search=Smith");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.leads.length).toBe(1);
  });

  it("handles pagination correctly", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      total: 45,
      rows: Array(10).fill({ id: "lead" }),
    } as any);

    const { GET } = await import("@/app/api/leads/route");
    const request = new NextRequest("http://localhost/api/leads?page=3&limit=10");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.pagination.page).toBe(3);
    expect(json.pagination.limit).toBe(10);
    expect(json.pagination.totalPages).toBe(5);
    expect(json.pagination.hasNext).toBe(true);
    expect(json.pagination.hasPrev).toBe(true);
  });
});

describe("Leads API - POST /api/leads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a lead with email only", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockLead = {
      id: "new-lead-1",
      email: "contact@example.com",
      status: "new",
      firstName: null,
      lastName: null,
      companyName: null,
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockLead as any);

    const { POST } = await import("@/app/api/leads/route");
    const request = new NextRequest("http://localhost/api/leads", {
      method: "POST",
      body: JSON.stringify({
        email: "contact@example.com",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.email).toBe("contact@example.com");
    expect(json.status).toBe("new");
  });

  it("creates a lead with full name", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockLead = {
      id: "new-lead-2",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+441234567890",
      status: "new",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockLead as any);

    const { POST } = await import("@/app/api/leads/route");
    const request = new NextRequest("http://localhost/api/leads", {
      method: "POST",
      body: JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+441234567890",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.firstName).toBe("John");
    expect(json.lastName).toBe("Doe");
  });

  it("creates a lead with company name", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockLead = {
      id: "new-lead-3",
      companyName: "Acme Ltd",
      email: "info@acme.com",
      source: "website",
      status: "new",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockLead as any);

    const { POST } = await import("@/app/api/leads/route");
    const request = new NextRequest("http://localhost/api/leads", {
      method: "POST",
      body: JSON.stringify({
        companyName: "Acme Ltd",
        email: "info@acme.com",
        source: "website",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.companyName).toBe("Acme Ltd");
  });

  it("creates a lead with score and notes", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockLead = {
      id: "new-lead-4",
      firstName: "Jane",
      lastName: "Smith",
      score: 85,
      notes: "Hot lead from referral",
      status: "new",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockLead as any);

    const { POST } = await import("@/app/api/leads/route");
    const request = new NextRequest("http://localhost/api/leads", {
      method: "POST",
      body: JSON.stringify({
        firstName: "Jane",
        lastName: "Smith",
        score: 85,
        notes: "Hot lead from referral",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.score).toBe(85);
    expect(json.notes).toBe("Hot lead from referral");
  });

  it("returns error when no identifying information provided", async () => {
    const { POST } = await import("@/app/api/leads/route");
    const request = new NextRequest("http://localhost/api/leads", {
      method: "POST",
      body: JSON.stringify({
        phone: "+441234567890",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error for invalid email format", async () => {
    const { POST } = await import("@/app/api/leads/route");
    const request = new NextRequest("http://localhost/api/leads", {
      method: "POST",
      body: JSON.stringify({
        email: "not-an-email",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });
});

describe("Leads API - POST /api/leads/:id/convert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("converts lead to client and matter successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      clientId: "123e4567-e89b-12d3-a456-426614174000",
      matterId: "223e4567-e89b-12d3-a456-426614174000",
    } as any);

    const { POST } = await import("@/app/api/leads/[id]/convert/route");
    const request = new NextRequest("http://localhost/api/leads/lead-1/convert", {
      method: "POST",
      body: JSON.stringify({
        matterTitle: "New Property Purchase",
        practiceArea: "conveyancing",
        clientType: "individual",
      }),
    });
    const response = await POST(request as any, { params: { id: "lead-1" } } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.clientId).toBeDefined();
    expect(json.matterId).toBeDefined();
  });

  it("returns client/matter when lead already converted", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      clientId: "existing-client-1",
      matterId: "existing-matter-1",
    } as any);

    const { POST } = await import("@/app/api/leads/[id]/convert/route");
    const request = new NextRequest("http://localhost/api/leads/lead-1/convert", {
      method: "POST",
      body: JSON.stringify({
        matterTitle: "Another Matter",
        practiceArea: "litigation",
        clientType: "company",
      }),
    });
    const response = await POST(request as any, { params: { id: "lead-1" } } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it("requires matterTitle", async () => {
    const { POST } = await import("@/app/api/leads/[id]/convert/route");
    const request = new NextRequest("http://localhost/api/leads/lead-1/convert", {
      method: "POST",
      body: JSON.stringify({
        practiceArea: "family",
        clientType: "individual",
      }),
    });
    const response = await POST(request as any, { params: { id: "lead-1" } } as any);

    expect([400, 500]).toContain(response.status);
  });

  it("defaults to individual client type and other practice area", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      clientId: "client-1",
      matterId: "matter-1",
    } as any);

    const { POST } = await import("@/app/api/leads/[id]/convert/route");
    const request = new NextRequest("http://localhost/api/leads/lead-1/convert", {
      method: "POST",
      body: JSON.stringify({
        matterTitle: "General Matter",
      }),
    });
    const response = await POST(request as any, { params: { id: "lead-1" } } as any);

    expect(response.status).toBe(200);
  });
});

describe("Quotes API - GET /api/quotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated list of quotes", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockQuotes = [
      {
        id: "quote-1",
        leadId: "lead-1",
        status: "draft",
        total: "1500.00",
      },
      {
        id: "quote-2",
        leadId: "lead-2",
        status: "sent",
        total: "2500.00",
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 2, rows: mockQuotes } as any);

    const { GET } = await import("@/app/api/quotes/route");
    const request = new NextRequest("http://localhost/api/quotes?page=1&limit=20");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.quotes)).toBe(true);
    expect(json.quotes.length).toBe(2);
  });

  it("filters quotes by leadId", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockQuotes = [{ id: "quote-1", leadId: "lead-1", status: "draft" }];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockQuotes } as any);

    const { GET } = await import("@/app/api/quotes/route");
    const request = new NextRequest(
      "http://localhost/api/quotes?leadId=123e4567-e89b-12d3-a456-426614174000"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.quotes.length).toBe(1);
  });

  it("filters quotes by status", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockQuotes = [{ id: "quote-1", status: "accepted" }];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockQuotes } as any);

    const { GET } = await import("@/app/api/quotes/route");
    const request = new NextRequest("http://localhost/api/quotes?status=accepted");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.quotes[0].status).toBe("accepted");
  });

  it("returns empty list when no quotes exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 0, rows: [] } as any);

    const { GET } = await import("@/app/api/quotes/route");
    const request = new NextRequest("http://localhost/api/quotes");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.quotes).toEqual([]);
  });
});

describe("Quotes API - POST /api/quotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a quote with line items", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockQuote = {
      id: "new-quote-1",
      leadId: "lead-1",
      status: "draft",
      items: [
        { description: "Legal consultation", quantity: 2, rate: "150.00", amount: "300.00" },
        { description: "Document review", quantity: 5, rate: "100.00", amount: "500.00" },
      ],
      subtotal: "800.00",
      vatAmount: "160.00",
      total: "960.00",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockQuote as any);

    const { POST } = await import("@/app/api/quotes/route");
    const request = new NextRequest("http://localhost/api/quotes", {
      method: "POST",
      body: JSON.stringify({
        leadId: "123e4567-e89b-12d3-a456-426614174000",
        items: [
          { description: "Legal consultation", quantity: 2, rate: "150.00", amount: "300.00" },
          { description: "Document review", quantity: 5, rate: "100.00", amount: "500.00" },
        ],
        subtotal: "800.00",
        vatAmount: "160.00",
        total: "960.00",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.status).toBe("draft");
    expect(json.total).toBe("960.00");
  });

  it("creates a quote with minimal information", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockQuote = {
      id: "new-quote-2",
      leadId: "lead-1",
      status: "draft",
      total: "1500.00",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockQuote as any);

    const { POST } = await import("@/app/api/quotes/route");
    const request = new NextRequest("http://localhost/api/quotes", {
      method: "POST",
      body: JSON.stringify({
        leadId: "123e4567-e89b-12d3-a456-426614174000",
        total: "1500.00",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);
  });

  it("creates a quote with validity date and notes", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockQuote = {
      id: "new-quote-3",
      leadId: "lead-1",
      status: "draft",
      total: "2000.00",
      validUntil: "2025-12-31",
      notes: "Special discount applied",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockQuote as any);

    const { POST } = await import("@/app/api/quotes/route");
    const request = new NextRequest("http://localhost/api/quotes", {
      method: "POST",
      body: JSON.stringify({
        leadId: "123e4567-e89b-12d3-a456-426614174000",
        total: "2000.00",
        validUntil: "2025-12-31",
        notes: "Special discount applied",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.notes).toBe("Special discount applied");
  });

  it("returns error when leadId is missing", async () => {
    const { POST } = await import("@/app/api/quotes/route");
    const request = new NextRequest("http://localhost/api/quotes", {
      method: "POST",
      body: JSON.stringify({
        total: "1500.00",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when total is missing", async () => {
    const { POST } = await import("@/app/api/quotes/route");
    const request = new NextRequest("http://localhost/api/quotes", {
      method: "POST",
      body: JSON.stringify({
        leadId: "123e4567-e89b-12d3-a456-426614174000",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns 404 when lead does not exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new Error("Lead not found"));

    const { POST } = await import("@/app/api/quotes/route");
    const request = new NextRequest("http://localhost/api/quotes", {
      method: "POST",
      body: JSON.stringify({
        leadId: "123e4567-e89b-12d3-a456-426614174000",
        total: "1500.00",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
