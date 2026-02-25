import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/schema", () => ({
  notifications: { firmId: "firm_id", userId: "user_id" },
  notificationPreferences: { firmId: "firm_id", userId: "user_id", preferences: "preferences" },
}));

function makeTx(prefRows: unknown[] = []) {
  const insertValues = vi.fn().mockResolvedValue(undefined);
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(prefRows),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: insertValues,
    }),
    _insertValues: insertValues,
  };
}

describe("createNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("inserts when no preferences row exists", async () => {
    const tx = makeTx([]);
    const { createNotification } = await import("@/lib/notifications/create");
    await createNotification(tx as any, {
      firmId: "f1",
      userId: "u1",
      type: "task_assigned",
      title: "Test",
    });
    expect(tx.insert).toHaveBeenCalled();
  });

  it("inserts when in_app is in channelsByType for the type", async () => {
    const tx = makeTx([
      { preferences: { channelsByType: { task_assigned: ["in_app", "email"] } } },
    ]);
    const { createNotification } = await import("@/lib/notifications/create");
    await createNotification(tx as any, {
      firmId: "f1",
      userId: "u1",
      type: "task_assigned",
      title: "Test",
    });
    expect(tx.insert).toHaveBeenCalled();
  });

  it("skips insert when in_app is absent from channelsByType for the type", async () => {
    const tx = makeTx([{ preferences: { channelsByType: { task_assigned: ["email"] } } }]);
    const { createNotification } = await import("@/lib/notifications/create");
    await createNotification(tx as any, {
      firmId: "f1",
      userId: "u1",
      type: "task_assigned",
      title: "Test",
    });
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it("inserts when type has no entry in channelsByType", async () => {
    const tx = makeTx([{ preferences: { channelsByType: {} } }]);
    const { createNotification } = await import("@/lib/notifications/create");
    await createNotification(tx as any, {
      firmId: "f1",
      userId: "u1",
      type: "task_assigned",
      title: "Test",
    });
    expect(tx.insert).toHaveBeenCalled();
  });

  it("defaults read to false and body/link/metadata to null", async () => {
    const tx = makeTx([]);
    const { createNotification } = await import("@/lib/notifications/create");
    await createNotification(tx as any, {
      firmId: "f1",
      userId: "u1",
      type: "system",
      title: "Hello",
    });
    const valueArg = tx._insertValues.mock.calls[0][0];
    expect(valueArg.read).toBe(false);
    expect(valueArg.body).toBeNull();
    expect(valueArg.link).toBeNull();
    expect(valueArg.metadata).toBeNull();
  });

  it("skips when channelsByType entry is empty array", async () => {
    const tx = makeTx([{ preferences: { channelsByType: { system: [] } } }]);
    const { createNotification } = await import("@/lib/notifications/create");
    await createNotification(tx as any, {
      firmId: "f1",
      userId: "u1",
      type: "system",
      title: "Test",
    });
    expect(tx.insert).not.toHaveBeenCalled();
  });
});

describe("createNotifications (bulk)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("no-ops on empty inputs array", async () => {
    const tx = makeTx();
    const { createNotifications } = await import("@/lib/notifications/create");
    await createNotifications(tx as any, []);
    expect(tx.select).not.toHaveBeenCalled();
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it("inserts all when no preferences exist", async () => {
    const insertValues = vi.fn().mockResolvedValue(undefined);
    const tx = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
      insert: vi.fn().mockReturnValue({ values: insertValues }),
    };
    const { createNotifications } = await import("@/lib/notifications/create");
    await createNotifications(tx as any, [
      { firmId: "f1", userId: "u1", type: "task_assigned", title: "T1" },
      { firmId: "f1", userId: "u2", type: "task_assigned", title: "T2" },
    ]);
    expect(tx.insert).toHaveBeenCalled();
    expect(insertValues.mock.calls[0][0]).toHaveLength(2);
  });

  it("filters out users who have disabled in_app for the type", async () => {
    const insertValues = vi.fn().mockResolvedValue(undefined);
    const tx = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              userId: "u1",
              preferences: { channelsByType: { task_assigned: ["email"] } },
            },
          ]),
        }),
      }),
      insert: vi.fn().mockReturnValue({ values: insertValues }),
    };
    const { createNotifications } = await import("@/lib/notifications/create");
    await createNotifications(tx as any, [
      { firmId: "f1", userId: "u1", type: "task_assigned", title: "T1" },
      { firmId: "f1", userId: "u2", type: "task_assigned", title: "T2" },
    ]);
    expect(tx.insert).toHaveBeenCalled();
    const inserted = insertValues.mock.calls[0][0] as any[];
    expect(inserted).toHaveLength(1);
    expect(inserted[0].userId).toBe("u2");
  });

  it("skips insert entirely when all users opt out", async () => {
    const tx = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              userId: "u1",
              preferences: { channelsByType: { task_assigned: [] } },
            },
          ]),
        }),
      }),
      insert: vi.fn().mockReturnValue({ values: vi.fn() }),
    };
    const { createNotifications } = await import("@/lib/notifications/create");
    await createNotifications(tx as any, [
      { firmId: "f1", userId: "u1", type: "task_assigned", title: "T" },
    ]);
    expect(tx.insert).not.toHaveBeenCalled();
  });
});
