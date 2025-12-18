/**
 * Demo Data Shared Types
 */

export interface SeedResult {
  firm: { id: string; name: string };
  users: { id: string; name: string; email: string }[];
  clients: { id: string; name: string; type: string }[];
  matters: { id: string; title: string; practiceArea: string }[];
  timeEntries: { id: string; description: string; amount: string }[];
  tasks: { id: string; title: string; status: string }[];
}

export interface SeederContext {
  now: Date;
  today: string;
  yesterday: string;
  result: SeedResult;
}

export function createSeederContext(): SeederContext {
  const now = new Date();
  return {
    now,
    today: now.toISOString().split("T")[0],
    yesterday: new Date(now.getTime() - 86400000).toISOString().split("T")[0],
    result: {
      firm: { id: "", name: "" },
      users: [],
      clients: [],
      matters: [],
      timeEntries: [],
      tasks: [],
    },
  };
}

/**
 * Helper to get a date N days ago
 */
export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Helper to get a date N days from now
 */
export function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
