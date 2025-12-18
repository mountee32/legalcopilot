import { describe, it, expect } from "vitest";
import {
  TIMELINE_TYPE_MAP,
  CATEGORY_CONFIG,
  CALENDAR_TYPE_MAP,
  getDisplayCategory,
  getCategoryConfig,
  getCalendarEventConfig,
  type DisplayCategory,
} from "@/app/(app)/matters/[id]/_components/timeline/types";

describe("Timeline Types", () => {
  describe("TIMELINE_TYPE_MAP", () => {
    it("maps document_uploaded to document category", () => {
      expect(TIMELINE_TYPE_MAP["document_uploaded"]).toBe("document");
    });

    it("maps document_summarized to document category", () => {
      expect(TIMELINE_TYPE_MAP["document_summarized"]).toBe("document");
    });

    it("maps email_received to email category", () => {
      expect(TIMELINE_TYPE_MAP["email_received"]).toBe("email");
    });

    it("maps email_sent to email category", () => {
      expect(TIMELINE_TYPE_MAP["email_sent"]).toBe("email");
    });

    it("maps task_created to task category", () => {
      expect(TIMELINE_TYPE_MAP["task_created"]).toBe("task");
    });

    it("maps task_completed to task category", () => {
      expect(TIMELINE_TYPE_MAP["task_completed"]).toBe("task");
    });

    it("maps billing types to billing category", () => {
      expect(TIMELINE_TYPE_MAP["time_entry_submitted"]).toBe("billing");
      expect(TIMELINE_TYPE_MAP["invoice_generated"]).toBe("billing");
      expect(TIMELINE_TYPE_MAP["payment_recorded"]).toBe("billing");
    });

    it("maps conflict check types to ai category", () => {
      expect(TIMELINE_TYPE_MAP["conflict_check_run"]).toBe("ai");
      expect(TIMELINE_TYPE_MAP["conflict_check_cleared"]).toBe("ai");
    });

    it("maps matter types to matter category", () => {
      expect(TIMELINE_TYPE_MAP["matter_created"]).toBe("matter");
      expect(TIMELINE_TYPE_MAP["matter_updated"]).toBe("matter");
      expect(TIMELINE_TYPE_MAP["matter_archived"]).toBe("matter");
    });

    it("maps all 25 timeline event types", () => {
      const allTypes = [
        "matter_created",
        "matter_updated",
        "matter_archived",
        "document_uploaded",
        "document_extracted",
        "document_chunked",
        "document_summarized",
        "document_entities_extracted",
        "email_received",
        "email_sent",
        "task_created",
        "task_completed",
        "time_entry_submitted",
        "time_entry_approved",
        "invoice_generated",
        "invoice_sent",
        "invoice_voided",
        "payment_recorded",
        "payment_deleted",
        "calendar_event_created",
        "calendar_event_updated",
        "calendar_event_deleted",
        "conflict_check_run",
        "conflict_check_cleared",
        "conflict_check_waived",
        "lead_converted",
        "quote_converted",
        "approval_decided",
        "note_added",
      ];

      allTypes.forEach((type) => {
        expect(TIMELINE_TYPE_MAP[type]).toBeDefined();
      });
    });
  });

  describe("CATEGORY_CONFIG", () => {
    it("has config for all display categories", () => {
      const categories: DisplayCategory[] = [
        "document",
        "email",
        "task",
        "billing",
        "calendar",
        "ai",
        "matter",
        "other",
      ];

      categories.forEach((category) => {
        expect(CATEGORY_CONFIG[category]).toBeDefined();
        expect(CATEGORY_CONFIG[category].icon).toBeDefined();
        expect(CATEGORY_CONFIG[category].bg).toMatch(/^bg-/);
        expect(CATEGORY_CONFIG[category].border).toMatch(/^border-/);
        expect(CATEGORY_CONFIG[category].iconColor).toMatch(/^text-/);
      });
    });

    it("has correct colors for document category", () => {
      expect(CATEGORY_CONFIG.document.bg).toBe("bg-blue-50");
      expect(CATEGORY_CONFIG.document.border).toBe("border-blue-200");
      expect(CATEGORY_CONFIG.document.iconColor).toBe("text-blue-600");
    });

    it("has correct colors for ai category", () => {
      expect(CATEGORY_CONFIG.ai.bg).toBe("bg-violet-50");
      expect(CATEGORY_CONFIG.ai.border).toBe("border-violet-200");
      expect(CATEGORY_CONFIG.ai.iconColor).toBe("text-violet-600");
    });
  });

  describe("CALENDAR_TYPE_MAP", () => {
    it("has config for hearing type", () => {
      expect(CALENDAR_TYPE_MAP.hearing).toBeDefined();
      expect(CALENDAR_TYPE_MAP.hearing.color).toBe("text-blue-600");
    });

    it("has config for deadline types", () => {
      expect(CALENDAR_TYPE_MAP.deadline).toBeDefined();
      expect(CALENDAR_TYPE_MAP.filing_deadline).toBeDefined();
    });

    it("has config for meeting type", () => {
      expect(CALENDAR_TYPE_MAP.meeting).toBeDefined();
      expect(CALENDAR_TYPE_MAP.meeting.color).toBe("text-green-600");
    });

    it("has fallback for other types", () => {
      expect(CALENDAR_TYPE_MAP.other).toBeDefined();
    });
  });

  describe("getDisplayCategory", () => {
    it("returns correct category for known types", () => {
      expect(getDisplayCategory("document_uploaded")).toBe("document");
      expect(getDisplayCategory("email_sent")).toBe("email");
      expect(getDisplayCategory("conflict_check_run")).toBe("ai");
    });

    it("returns other for unknown types", () => {
      expect(getDisplayCategory("unknown_type")).toBe("other");
      expect(getDisplayCategory("")).toBe("other");
    });
  });

  describe("getCategoryConfig", () => {
    it("returns config for known categories", () => {
      const config = getCategoryConfig("document");
      expect(config.icon).toBeDefined();
      expect(config.bg).toBe("bg-blue-50");
    });

    it("returns config for all categories", () => {
      const categories: DisplayCategory[] = [
        "document",
        "email",
        "task",
        "billing",
        "calendar",
        "ai",
        "matter",
        "other",
      ];

      categories.forEach((category) => {
        const config = getCategoryConfig(category);
        expect(config).toBeDefined();
        expect(config.icon).toBeDefined();
      });
    });
  });

  describe("getCalendarEventConfig", () => {
    it("returns config for known event types", () => {
      const config = getCalendarEventConfig("hearing");
      expect(config.icon).toBeDefined();
      expect(config.color).toBe("text-blue-600");
    });

    it("returns fallback for unknown types", () => {
      const config = getCalendarEventConfig("unknown");
      expect(config).toEqual(CALENDAR_TYPE_MAP.other);
    });
  });
});
