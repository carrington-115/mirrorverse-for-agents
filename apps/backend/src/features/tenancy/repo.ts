import { eq, schema, type Database } from "@mirrorverse/db";
import type { UserId } from "@mirrorverse/types";

const { workspaces, workspaceMembers, userProfiles } = schema;

const DEFAULT_PLAN_ID = "free";

interface InsertWorkspaceAndMemberArgs {
  readonly name: string;
  readonly slug: string;
  readonly ownerId: UserId;
}

async function insertWorkspaceAndMember(
  db: Database,
  args: InsertWorkspaceAndMemberArgs,
) {
  return db.transaction(async (tx) => {
    const [workspace] = await tx
      .insert(workspaces)
      .values({
        slug: args.slug,
        name: args.name,
        planId: DEFAULT_PLAN_ID,
        ownerId: args.ownerId,
      })
      .returning();
    if (!workspace) throw new Error("Workspace insert returned no row");
    await tx.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: args.ownerId,
      role: "owner",
      acceptedAt: new Date(),
    });
    await tx
      .update(userProfiles)
      .set({ defaultWorkspaceId: workspace.id })
      .where(eq(userProfiles.id, args.ownerId));
    return workspace;
  });
}

// Resolves the user's implicit workspace, creating it on first call.
// For B2C, every user has exactly one workspace.
export async function ensureUserWorkspace(
  db: Database,
  userId: UserId,
): Promise<string> {
  const [profile] = await db
    .select({
      defaultWorkspaceId: userProfiles.defaultWorkspaceId,
      email: userProfiles.email,
    })
    .from(userProfiles)
    .where(eq(userProfiles.id, userId))
    .limit(1);

  if (profile?.defaultWorkspaceId) return profile.defaultWorkspaceId;

  const slug = `u-${userId.slice(0, 8)}-${Date.now().toString(36)}`;
  const workspace = await insertWorkspaceAndMember(db, {
    name: profile?.email ? profile.email.split("@")[0]! : "Personal",
    slug,
    ownerId: userId,
  });
  return workspace.id;
}
