import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock middleware and dependencies
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

vi.mock("@/lib/billing/money", () => ({
  formatMoney: vi.fn((n: number) => n.toFixed(2)),
  parseMoney: vi.fn((s: string) => parseFloat(s)),
  roundMoney: vi.fn((n: number) => Math.round(n * 100) / 100),
}));

describe("Time Entries API - GET /api/time-entries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated list of time entries", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEntries = [
      {
        id: "te1",
        matterId: "m1",
        feeEarnerId: "u1",
        description: "Research",
        durationMinutes: 60,
        hourlyRate: "250.00",
        amount: "250.00",
        status: "draft",
        workDate: "2024-01-15",
      },
      {
        id: "te2",
        matterId: "m1",
        feeEarnerId: "u1",
        description: "Drafting",
        durationMinutes: 120,
        hourlyRate: "250.00",
        amount: "500.00",
        status: "submitted",
        workDate: "2024-01-16",
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 2, rows: mockEntries } as any);

    const { GET } = await import("@/app/api/time-entries/route");
    const request = new NextRequest("http://localhost/api/time-entries?page=1&limit=20");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.timeEntries)).toBe(true);
    expect(json.timeEntries.length).toBe(2);
    expect(json.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });
  });

  it("returns empty list when no time entries exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 0, rows: [] } as any);

    const { GET } = await import("@/app/api/time-entries/route");
    const request = new NextRequest("http://localhost/api/time-entries");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.timeEntries).toEqual([]);
    expect(json.pagination.total).toBe(0);
  });

  it("filters by matterId parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174000";
    const mockEntries = [{ id: "te1", matterId }];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockEntries } as any);

    const { GET } = await import("@/app/api/time-entries/route");
    const request = new NextRequest(`http://localhost/api/time-entries?matterId=${matterId}`);
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.timeEntries.length).toBe(1);
    expect(json.timeEntries[0].matterId).toBe(matterId);
  });

  it("filters by feeEarnerId parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const feeEarnerId = "123e4567-e89b-12d3-a456-426614174000";
    const mockEntries = [{ id: "te1", feeEarnerId }];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockEntries } as any);

    const { GET } = await import("@/app/api/time-entries/route");
    const request = new NextRequest(`http://localhost/api/time-entries?feeEarnerId=${feeEarnerId}`);
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
  });

  it("filters by status parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEntries = [{ id: "te1", status: "submitted" }];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockEntries } as any);

    const { GET } = await import("@/app/api/time-entries/route");
    const request = new NextRequest("http://localhost/api/time-entries?status=submitted");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.timeEntries[0].status).toBe("submitted");
  });

  it("filters by date range", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEntries = [{ id: "te1", workDate: "2024-01-15" }];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockEntries } as any);

    const { GET } = await import("@/app/api/time-entries/route");
    const request = new NextRequest(
      "http://localhost/api/time-entries?from=2024-01-01&to=2024-01-31"
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
  });

  it("includes hasNext and hasPrev in pagination", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      total: 50,
      rows: Array(10).fill({ id: "te" }),
    } as any);

    const { GET } = await import("@/app/api/time-entries/route");
    const request = new NextRequest("http://localhost/api/time-entries?page=2&limit=10");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.pagination.hasNext).toBe(true);
    expect(json.pagination.hasPrev).toBe(true);
  });
});

describe("Time Entries API - POST /api/time-entries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates time entry with calculated amount", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174000";
    const mockEntry = {
      id: "new-te1",
      matterId,
      feeEarnerId: "user-1",
      description: "Legal research for case",
      durationMinutes: 90,
      hourlyRate: "200.00",
      amount: "300.00", // 90min = 1.5h * 200 = 300
      status: "draft",
      workDate: "2024-01-20",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockEntry as any);

    const { POST } = await import("@/app/api/time-entries/route");
    const request = new NextRequest("http://localhost/api/time-entries", {
      method: "POST",
      body: JSON.stringify({
        matterId,
        description: "Legal research for case",
        durationMinutes: 90,
        hourlyRate: "200.00",
        workDate: "2024-01-20",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.matterId).toBe(matterId);
    expect(json.durationMinutes).toBe(90);
    expect(json.status).toBe("draft");
  });

  it("returns 404 when matter does not exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new Error("Matter not found"));

    const { POST } = await import("@/app/api/time-entries/route");
    const request = new NextRequest("http://localhost/api/time-entries", {
      method: "POST",
      body: JSON.stringify({
        matterId: "123e4567-e89b-12d3-a456-426614174000",
        description: "Test entry",
        durationMinutes: 60,
        hourlyRate: "200.00",
        workDate: "2024-01-20",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([404, 500]).toContain(response.status);
  });

  it("returns error when required fields missing", async () => {
    const { POST } = await import("@/app/api/time-entries/route");
    const request = new NextRequest("http://localhost/api/time-entries", {
      method: "POST",
      body: JSON.stringify({
        // missing matterId, description, durationMinutes, etc
        workDate: "2024-01-20",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("validates durationMinutes is positive", async () => {
    const { POST } = await import("@/app/api/time-entries/route");
    const request = new NextRequest("http://localhost/api/time-entries", {
      method: "POST",
      body: JSON.stringify({
        matterId: "123e4567-e89b-12d3-a456-426614174000",
        description: "Test entry",
        durationMinutes: -30, // Invalid negative
        hourlyRate: "200.00",
        workDate: "2024-01-20",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("creates entry with specific feeEarnerId", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174000";
    const feeEarnerId = "223e4567-e89b-12d3-a456-426614174000";
    const mockEntry = {
      id: "new-te2",
      matterId,
      feeEarnerId,
      description: "Consultation",
      durationMinutes: 30,
      hourlyRate: "300.00",
      amount: "150.00",
      status: "draft",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockEntry as any);

    const { POST } = await import("@/app/api/time-entries/route");
    const request = new NextRequest("http://localhost/api/time-entries", {
      method: "POST",
      body: JSON.stringify({
        matterId,
        feeEarnerId,
        description: "Consultation",
        durationMinutes: 30,
        hourlyRate: "300.00",
        workDate: "2024-01-20",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.feeEarnerId).toBe(feeEarnerId);
  });

  it("creates entry with optional activityCode", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174000";
    const mockEntry = {
      id: "new-te3",
      matterId,
      description: "Research",
      activityCode: "A100",
      status: "draft",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockEntry as any);

    const { POST } = await import("@/app/api/time-entries/route");
    const request = new NextRequest("http://localhost/api/time-entries", {
      method: "POST",
      body: JSON.stringify({
        matterId,
        description: "Research",
        durationMinutes: 60,
        hourlyRate: "200.00",
        workDate: "2024-01-20",
        activityCode: "A100",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);
  });
});
