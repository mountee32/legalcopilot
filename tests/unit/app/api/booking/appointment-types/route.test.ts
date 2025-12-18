import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock modules
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn(),
    offset: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  appointmentTypes: {
    id: "id",
    firmId: "firmId",
    name: "name",
    createdAt: "createdAt",
  },
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(async (_firmId, callback) => {
    // Provide a mock transaction object
    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ total: 1 }]),
      offset: vi.fn().mockResolvedValue([]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };
    return callback(mockTx);
  }),
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn().mockResolvedValue("firm-123"),
}));

vi.mock("@/middleware/withAuth", () => ({
  withAuth: vi.fn((handler) => handler),
}));

vi.mock("@/middleware/withErrorHandler", () => ({
  withErrorHandler: vi.fn((handler) => handler),
}));

vi.mock("@/middleware/withPermission", () => ({
  withPermission: vi.fn(() => (handler: any) => handler),
}));

vi.mock("@/lib/api/schemas/booking", () => ({
  PaginationSchema: {
    parse: vi.fn((data) => ({
      page: Number(data.page) || 1,
      limit: Number(data.limit) || 10,
    })),
  },
  CreateAppointmentTypeSchema: {
    parse: vi.fn((data) => data),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value })),
  desc: vi.fn((field) => ({ field, direction: "desc" })),
  sql: vi.fn(),
  and: vi.fn((...args) => ({ type: "and", args })),
}));

describe("Appointment Types API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/booking/appointment-types", () => {
    it("should return list of appointment types", async () => {
      const mockAppointmentTypes = [
        {
          id: "appt-1",
          firmId: "firm-123",
          name: "Initial Consultation",
          description: "30-minute consultation",
          practiceArea: "conveyancing",
          duration: 30,
          bufferAfter: 10,
          isActive: true,
          maxAdvanceBookingDays: 30,
          minNoticeHours: 24,
          settings: null,
          createdById: "user-1",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ];

      const { withFirmDb } = await import("@/lib/db/tenant");
      vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
        let callCount = 0;
        const mockTx = {
          select: vi.fn(function (this: any) {
            callCount++;
            return this;
          }),
          from: vi.fn(function (this: any) {
            return this;
          }),
          where: vi.fn(function (this: any) {
            // First call is count query, second is data query
            if (callCount === 1) {
              return Promise.resolve([{ total: 1 }]);
            }
            return this;
          }),
          orderBy: vi.fn(function (this: any) {
            return this;
          }),
          limit: vi.fn(function (this: any) {
            return this;
          }),
          offset: vi.fn(() => Promise.resolve(mockAppointmentTypes)),
        };
        return callback(mockTx as any);
      });

      const { GET } = await import("@/app/api/booking/appointment-types/route");

      const request = new NextRequest(
        "http://localhost:3000/api/booking/appointment-types?page=1&limit=10"
      );
      const response = await GET(request, { user: { user: { id: "user-1" } } } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.appointmentTypes).toHaveLength(1);
      expect(data.pagination.total).toBe(1);
    });
  });

  describe("POST /api/booking/appointment-types", () => {
    it("should create a new appointment type", async () => {
      const mockAppointmentType = {
        id: "appt-new",
        firmId: "firm-123",
        name: "New Consultation",
        description: "45-minute consultation",
        practiceArea: "litigation",
        duration: 45,
        bufferAfter: 15,
        isActive: true,
        maxAdvanceBookingDays: null,
        minNoticeHours: 48,
        settings: null,
        createdById: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { withFirmDb } = await import("@/lib/db/tenant");
      vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
        const mockTx = {
          insert: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValueOnce([mockAppointmentType]),
        };
        return callback(mockTx as any);
      });

      const { POST } = await import("@/app/api/booking/appointment-types/route");

      const request = new NextRequest("http://localhost:3000/api/booking/appointment-types", {
        method: "POST",
        body: JSON.stringify({
          name: "New Consultation",
          description: "45-minute consultation",
          practiceArea: "litigation",
          duration: 45,
          bufferAfter: 15,
          minNoticeHours: 48,
        }),
      });

      const response = await POST(request, { user: { user: { id: "user-1" } } } as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe("New Consultation");
    });
  });
});
