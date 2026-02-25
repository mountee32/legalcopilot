import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/schema", () => ({
  tasks: { firmId: "firmId", matterId: "matterId" },
  calendarEvents: { firmId: "firmId", matterId: "matterId" },
}));

const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
const mockTx = { insert: mockInsert } as any;

vi.mock("@/lib/timeline/createEvent", () => ({
  createTimelineEvent: vi.fn(async () => undefined),
}));

describe("executeActionSideEffects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("creates a task for create_task action with tasks array payload", async () => {
    const { executeActionSideEffects } = await import("@/app/api/pipeline/actions/[id]/execute");
    const { createTimelineEvent } = await import("@/lib/timeline/createEvent");

    const action = {
      id: "action-1",
      firmId: "firm-1",
      matterId: "matter-1",
      actionType: "create_task",
      actionPayload: {
        tasks: [{ title: "Review document", description: "Check for errors", priority: "high" }],
      },
    };

    const result = await executeActionSideEffects(mockTx, action, "user-1");

    expect(result.executed).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
    expect(vi.mocked(createTimelineEvent)).toHaveBeenCalledWith(
      mockTx,
      expect.objectContaining({
        type: "task_created",
        firmId: "firm-1",
        matterId: "matter-1",
      })
    );
  });

  it("creates a task for create_task action with single task payload", async () => {
    const { executeActionSideEffects } = await import("@/app/api/pipeline/actions/[id]/execute");

    const action = {
      id: "action-2",
      firmId: "firm-1",
      matterId: "matter-1",
      actionType: "create_task",
      actionPayload: { title: "Single task", priority: "medium" },
    };

    const result = await executeActionSideEffects(mockTx, action, "user-1");

    expect(result.executed).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("returns error for create_task with empty payload", async () => {
    const { executeActionSideEffects } = await import("@/app/api/pipeline/actions/[id]/execute");

    const action = {
      id: "action-3",
      firmId: "firm-1",
      matterId: "matter-1",
      actionType: "create_task",
      actionPayload: {},
    };

    const result = await executeActionSideEffects(mockTx, action, "user-1");

    expect(result.executed).toBe(false);
    expect(result.error).toBe("No tasks in actionPayload");
  });

  it("creates a calendar event for create_deadline action", async () => {
    const { executeActionSideEffects } = await import("@/app/api/pipeline/actions/[id]/execute");
    const { createTimelineEvent } = await import("@/lib/timeline/createEvent");

    const action = {
      id: "action-4",
      firmId: "firm-1",
      matterId: "matter-1",
      actionType: "create_deadline",
      actionPayload: {
        title: "Filing deadline",
        startAt: "2026-04-01T09:00:00Z",
        priority: "high",
      },
    };

    const result = await executeActionSideEffects(mockTx, action, "user-1");

    expect(result.executed).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
    expect(vi.mocked(createTimelineEvent)).toHaveBeenCalledWith(
      mockTx,
      expect.objectContaining({
        type: "calendar_event_created",
        firmId: "firm-1",
      })
    );
  });

  it("returns error for create_deadline with missing startAt", async () => {
    const { executeActionSideEffects } = await import("@/app/api/pipeline/actions/[id]/execute");

    const action = {
      id: "action-5",
      firmId: "firm-1",
      matterId: "matter-1",
      actionType: "create_deadline",
      actionPayload: { title: "No date" },
    };

    const result = await executeActionSideEffects(mockTx, action, "user-1");

    expect(result.executed).toBe(false);
    expect(result.error).toContain("Missing title or startAt");
  });

  it("returns not executed for unknown action types", async () => {
    const { executeActionSideEffects } = await import("@/app/api/pipeline/actions/[id]/execute");

    const action = {
      id: "action-6",
      firmId: "firm-1",
      matterId: "matter-1",
      actionType: "flag_risk",
      actionPayload: {},
    };

    const result = await executeActionSideEffects(mockTx, action, "user-1");

    expect(result.executed).toBe(false);
    expect(result.error).toBeUndefined();
  });
});
