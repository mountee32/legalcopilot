import { db } from "@/lib/db";
import { taskExceptions } from "@/lib/db/schema";
import { DEMO_IDS } from "../ids";
import type { SeederContext } from "../types";

export async function seedTaskExceptions(ctx: SeederContext) {
  console.log("  Seeding task exceptions...");
  const result: Array<{ id: string; objectId: string; exceptionType: string }> = [];

  const now = ctx.now;
  const eightDaysAgo = new Date(now.getTime() - 8 * 86400000);
  const nineDaysAgo = new Date(now.getTime() - 9 * 86400000);

  const exceptionsData = [
    // Exception for Task 41: Building survey skipped
    {
      id: DEMO_IDS.taskExceptions.exc1,
      firmId: DEMO_IDS.firm,
      objectType: "task" as const,
      objectId: DEMO_IDS.tasks.task41,
      exceptionType: "skipped" as const,
      reason: "Client declined full survey - happy with mortgage valuation only",
      decisionSource: "user" as const,
      approvedById: DEMO_IDS.users.associate,
      approvedAt: eightDaysAgo,
      metadata: {
        originalStatus: "pending",
        clientNotified: true,
        adviceGiven: "Explained risks of proceeding without full survey",
      },
      createdAt: eightDaysAgo,
    },
    // Exception for Task 42: Help to Buy ISA not applicable
    {
      id: DEMO_IDS.taskExceptions.exc2,
      firmId: DEMO_IDS.firm,
      objectType: "task" as const,
      objectId: DEMO_IDS.tasks.task42,
      exceptionType: "not_applicable" as const,
      reason: "Client confirmed no Help to Buy ISA - using cash deposit",
      decisionSource: "user" as const,
      approvedById: DEMO_IDS.users.associate,
      approvedAt: nineDaysAgo,
      metadata: {
        originalStatus: "pending",
        clientConfirmation: "Email dated 2024-12-10",
      },
      createdAt: nineDaysAgo,
    },
  ];

  for (const exceptionData of exceptionsData) {
    const [exception] = await db
      .insert(taskExceptions)
      .values(exceptionData)
      .onConflictDoUpdate({
        target: taskExceptions.id,
        set: { reason: exceptionData.reason },
      })
      .returning();

    result.push({
      id: exception.id,
      objectId: exception.objectId,
      exceptionType: exception.exceptionType,
    });
    console.log(
      `    Created exception: ${exception.exceptionType} - ${exception.reason.substring(0, 40)}...`
    );
  }

  return result;
}
