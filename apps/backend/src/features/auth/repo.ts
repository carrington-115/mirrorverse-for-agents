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
