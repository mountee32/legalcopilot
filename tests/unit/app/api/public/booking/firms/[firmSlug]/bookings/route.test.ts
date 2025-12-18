import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock modules
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  bookings: {
    id: "id",
    firmId: "firmId",
    appointmentTypeId: "appointmentTypeId",
    status: "status",
  },
  appointmentTypes: {
    id: "id",
    firmId: "firmId",
    isActive: "isActive",
  },
  firms: {
    id: "id",
    name: "name",
  },
}));

vi.mock("@/middleware/withRateLimit", () => ({
  withRateLimit: vi.fn((handler) => handler),
  RateLimitPresets: {
    public: { max: 3, windowSeconds: 60 },
  },
}));

vi.mock("@/middleware/withErrorHandler", () => ({
  withErrorHandler: vi.fn((handler) => handler),
}));

vi.mock("@/lib/api/schemas/booking", () => ({
  PublicCreateBookingSchema: {
    parse: vi.fn((data) => data),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value })),
  and: vi.fn((...args) => ({ type: "and", args })),
  or: vi.fn((...args) => ({ type: "or", args })),
  gte: vi.fn((field, value) => ({ field, value, op: "gte" })),
  lte: vi.fn((field, value) => ({ field, value, op: "lte" })),
}));

describe("Public Bookings API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/public/booking/firms/[firmSlug]/bookings", () => {
    it("should create a booking with valid data", async () => {
      const mockFirm = {
        id: "firm-123",
        name: "Test Law Firm",
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAppointmentType = {
        id: "appt-1",
        firmId: "firm-123",
        name: "Consultation",
        duration: 30,
        bufferAfter: 10,
        isActive: true,
        minNoticeHours: 24,
        maxAdvanceBookingDays: 30,
      };

      const mockBooking = {
        id: "booking-1",
        firmId: "firm-123",
        appointmentTypeId: "appt-1",
        status: "pending",
        startAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 48 * 60 * 60 * 1000 + 30 * 60 * 1000),
        clientName: "John Doe",
        clientEmail: "john@example.com",
        clientPhone: "+44 20 1234 5678",
        notes: "Need consultation",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { db } = await import("@/lib/db");

      // Mock firm lookup
      vi.mocked(db.limit).mockResolvedValueOnce([mockFirm]);
      // Mock appointment type lookup
      vi.mocked(db.limit).mockResolvedValueOnce([mockAppointmentType]);
      // Mock conflict check
      vi.mocked(db.limit).mockResolvedValueOnce([]);
      // Mock insert
      vi.mocked(db.returning).mockResolvedValueOnce([mockBooking]);

      const { POST } = await import("@/app/api/public/booking/firms/[firmSlug]/bookings/route");

      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const request = new NextRequest(
        "http://localhost:3000/api/public/booking/firms/firm-123/bookings",
        {
          method: "POST",
          body: JSON.stringify({
            appointmentTypeId: "appt-1",
            startAt: futureDate,
            clientName: "John Doe",
            clientEmail: "john@example.com",
            clientPhone: "+44 20 1234 5678",
            notes: "Need consultation",
          }),
        }
      );

      const response = await POST(request, { params: { firmSlug: "firm-123" } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.bookingId).toBe("booking-1");
    });

    it("should reject booking with insufficient notice", async () => {
      const mockFirm = {
        id: "firm-123",
        name: "Test Law Firm",
      };

      const mockAppointmentType = {
        id: "appt-1",
        firmId: "firm-123",
        duration: 30,
        minNoticeHours: 48,
        isActive: true,
      };

      const { db } = await import("@/lib/db");

      // Mock firm lookup
      vi.mocked(db.limit).mockResolvedValueOnce([mockFirm]);
      // Mock appointment type lookup
      vi.mocked(db.limit).mockResolvedValueOnce([mockAppointmentType]);

      const { POST } = await import("@/app/api/public/booking/firms/[firmSlug]/bookings/route");

      // Try to book 12 hours from now (less than 48 hours required)
      const tooSoonDate = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
      const request = new NextRequest(
        "http://localhost:3000/api/public/booking/firms/firm-123/bookings",
        {
          method: "POST",
          body: JSON.stringify({
            appointmentTypeId: "appt-1",
            startAt: tooSoonDate,
            clientName: "John Doe",
            clientEmail: "john@example.com",
          }),
        }
      );

      const response = await POST(request, { params: { firmSlug: "firm-123" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Booking time is too soon");
    });

    it("should reject booking when appointment type not found", async () => {
      const mockFirm = {
        id: "firm-123",
        name: "Test Law Firm",
      };

      const { db } = await import("@/lib/db");

      // Mock firm lookup
      vi.mocked(db.limit).mockResolvedValueOnce([mockFirm]);
      // Mock appointment type not found
      vi.mocked(db.limit).mockResolvedValueOnce([]);

      const { POST } = await import("@/app/api/public/booking/firms/[firmSlug]/bookings/route");

      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const request = new NextRequest(
        "http://localhost:3000/api/public/booking/firms/firm-123/bookings",
        {
          method: "POST",
          body: JSON.stringify({
            appointmentTypeId: "nonexistent",
            startAt: futureDate,
            clientName: "John Doe",
            clientEmail: "john@example.com",
          }),
        }
      );

      const response = await POST(request, { params: { firmSlug: "firm-123" } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Appointment type not found or not available");
    });

    it("should reject booking when time slot has conflict", async () => {
      const mockFirm = {
        id: "firm-123",
        name: "Test Law Firm",
      };

      const mockAppointmentType = {
        id: "appt-1",
        firmId: "firm-123",
        duration: 30,
        minNoticeHours: 24,
        isActive: true,
      };

      const existingBooking = {
        id: "existing-1",
        status: "confirmed",
        startAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 48 * 60 * 60 * 1000 + 30 * 60 * 1000),
      };

      const { db } = await import("@/lib/db");

      // Mock firm lookup
      vi.mocked(db.limit).mockResolvedValueOnce([mockFirm]);
      // Mock appointment type lookup
      vi.mocked(db.limit).mockResolvedValueOnce([mockAppointmentType]);
      // Mock conflict found
      vi.mocked(db.limit).mockResolvedValueOnce([existingBooking]);

      const { POST } = await import("@/app/api/public/booking/firms/[firmSlug]/bookings/route");

      const conflictDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const request = new NextRequest(
        "http://localhost:3000/api/public/booking/firms/firm-123/bookings",
        {
          method: "POST",
          body: JSON.stringify({
            appointmentTypeId: "appt-1",
            startAt: conflictDate,
            clientName: "Jane Doe",
            clientEmail: "jane@example.com",
          }),
        }
      );

      const response = await POST(request, { params: { firmSlug: "firm-123" } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Time slot not available");
    });
  });
});
