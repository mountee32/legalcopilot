import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { firms, users } from "@/lib/db/schema";
import { ensureDefaultRoleForUser } from "@/lib/auth/rbac";

export async function getOrCreateFirmIdForUser(userId: string): Promise<string> {
  const { firmId, needsRoleAssignment } = await db.transaction(async (tx) => {
    const [user] = await tx
      .select({ firmId: users.firmId, roleId: users.roleId, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("Authenticated user not found");
    }

    if (user.firmId) {
      return { firmId: user.firmId, needsRoleAssignment: !user.roleId };
    }

    const firmName = user.email.includes("@") ? user.email.split("@")[1] : "Default Firm";

    const [firm] = await tx
      .insert(firms)
      .values({
        name: firmName,
      })
      .returning({ id: firms.id });

    await tx.update(users).set({ firmId: firm.id }).where(eq(users.id, userId));
    return { firmId: firm.id, needsRoleAssignment: true };
  });

  if (needsRoleAssignment) {
    await ensureDefaultRoleForUser(userId, firmId);
  }

  return firmId;
}
