import { db } from "@/lib/db";
import { firms, users, roles } from "@/lib/db/schema";
import { DEMO_IDS, DEMO_PREFIX } from "../ids";
import { SeederContext } from "../types";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/auth/permissions";

export async function seedFirm(ctx: SeederContext) {
  const now = new Date();

  // 1. Create firm
  const [firm] = await db
    .insert(firms)
    .values({
      id: DEMO_IDS.firm,
      name: `${DEMO_PREFIX}Harrison & Clarke Solicitors`,
      settings: {
        sraNumber: "SRA123456",
        status: "active",
        plan: "enterprise",
        email: "info@harrisonclark.demo",
      },
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: firms.id,
      set: { updatedAt: now },
    })
    .returning();

  ctx.result.firm = { id: firm.id, name: firm.name };
  console.log(`  Created firm: ${firm.name}`);

  // 2. Create users
  const usersData = [
    {
      id: DEMO_IDS.users.partner,
      firmId: DEMO_IDS.firm,
      email: "sarah.harrison@harrisonclark.demo",
      name: `${DEMO_PREFIX}Sarah Harrison`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.users.associate,
      firmId: DEMO_IDS.firm,
      email: "james.clarke@harrisonclark.demo",
      name: `${DEMO_PREFIX}James Clarke`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.users.seniorPartner,
      firmId: DEMO_IDS.firm,
      email: "victoria.clarke@harrisonclark.demo",
      name: `${DEMO_PREFIX}Victoria Clarke`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.users.associate2,
      firmId: DEMO_IDS.firm,
      email: "emma.williams@harrisonclark.demo",
      name: `${DEMO_PREFIX}Emma Williams`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.users.associate3,
      firmId: DEMO_IDS.firm,
      email: "david.chen@harrisonclark.demo",
      name: `${DEMO_PREFIX}David Chen`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.users.paralegal1,
      firmId: DEMO_IDS.firm,
      email: "tom.richards@harrisonclark.demo",
      name: `${DEMO_PREFIX}Tom Richards`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.users.paralegal2,
      firmId: DEMO_IDS.firm,
      email: "sophie.brown@harrisonclark.demo",
      name: `${DEMO_PREFIX}Sophie Brown`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.users.receptionist,
      firmId: DEMO_IDS.firm,
      email: "lucy.taylor@harrisonclark.demo",
      name: `${DEMO_PREFIX}Lucy Taylor`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const createdUsers: Array<{ id: string; name: string; email: string }> = [];

  for (const userData of usersData) {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          firmId: userData.firmId,
          name: userData.name,
          email: userData.email,
          updatedAt: now,
        },
      })
      .returning();

    createdUsers.push({ id: user.id, name: user.name!, email: user.email! });
    ctx.result.users.push({ id: user.id, name: user.name!, email: user.email! });
    console.log(`    Created user: ${user.name}`);
  }

  // 3. Create default roles for the firm
  const [adminRole] = await db
    .insert(roles)
    .values({
      firmId: DEMO_IDS.firm,
      name: "admin",
      description: "Firm administrator with full access",
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [roles.firmId, roles.name],
      set: {
        permissions: DEFAULT_ROLE_PERMISSIONS.admin,
        updatedAt: now,
      },
    })
    .returning();

  const [feeEarnerRole] = await db
    .insert(roles)
    .values({
      firmId: DEMO_IDS.firm,
      name: "fee_earner",
      description: "Fee earner with standard permissions",
      permissions: DEFAULT_ROLE_PERMISSIONS.fee_earner,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [roles.firmId, roles.name],
      set: {
        permissions: DEFAULT_ROLE_PERMISSIONS.fee_earner,
        updatedAt: now,
      },
    })
    .returning();

  console.log(`    Created roles: admin, fee_earner`);

  // 4. Assign roles to users (first user = admin, rest = fee_earner)
  const { eq } = await import("drizzle-orm");
  for (let i = 0; i < createdUsers.length; i++) {
    const roleId = i === 0 ? adminRole.id : feeEarnerRole.id;
    await db.update(users).set({ roleId, updatedAt: now }).where(eq(users.id, createdUsers[i].id));
  }
  console.log(`    Assigned roles to ${createdUsers.length} users`);

  return { firm, users: createdUsers };
}
