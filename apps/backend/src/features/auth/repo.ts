import { eq, schema, type Database } from "@mirrorverse/db";
import type { UserId } from "@mirrorverse/types";

const { userProfiles } = schema;

export async function getProfile(db: Database, userId: UserId) {
  const [row] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, userId))
    .limit(1);
  return row ?? null;
}

export interface UpsertProfileArgs {
  readonly userId: UserId;
  readonly email: string;
  readonly fullName?: string;
  readonly avatarUrl?: string;
}

export async function upsertProfile(db: Database, args: UpsertProfileArgs) {
  const [row] = await db
    .insert(userProfiles)
    .values({
      id: args.userId,
      email: args.email,
      fullName: args.fullName ?? null,
      avatarUrl: args.avatarUrl ?? null,
    })
    .onConflictDoUpdate({
      target: userProfiles.id,
      set: {
        email: args.email,
        ...(args.fullName ? { fullName: args.fullName } : {}),
        ...(args.avatarUrl ? { avatarUrl: args.avatarUrl } : {}),
      },
    })
    .returning();
  return row;
}

export interface CompleteOnboardingArgs {
  readonly userId: UserId;
  readonly name: string;
  readonly defaultWorkspaceId: string;
  readonly hearAboutUs?: string;
  readonly role?: string;
  readonly otherRole?: string;
}

export async function completeOnboarding(
  db: Database,
  args: CompleteOnboardingArgs,
) {
  const [row] = await db
    .update(userProfiles)
    .set({
      fullName: args.name,
      defaultWorkspaceId: args.defaultWorkspaceId,
      onboardingCompletedAt: new Date(),
      hearAboutUs: args.hearAboutUs ?? null,
      role: args.role ?? null,
      otherRole: args.otherRole ?? null,
    })
    .where(eq(userProfiles.id, args.userId))
    .returning();
  return row ?? null;
}
