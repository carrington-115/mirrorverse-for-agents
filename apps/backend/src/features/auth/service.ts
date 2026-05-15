import type { Database } from "@mirrorverse/db";
import type { UserId } from "@mirrorverse/types";

import { appError, ErrCode } from "../../lib/errors";
import { ensureUserWorkspace } from "../tenancy/repo";

import * as repo from "./repo";
import type { CompleteOnboardingInput, SyncProfileInput } from "./inputs";

interface BaseCtx {
  readonly db: Database;
  readonly userId: UserId;
}

export const authService = {
  async syncProfile(ctx: BaseCtx, input: SyncProfileInput) {
    return repo.upsertProfile(ctx.db, {
      userId: ctx.userId,
      email: input.email,
      fullName: input.fullName,
      avatarUrl: input.avatarUrl,
    });
  },

  async me(ctx: BaseCtx & { email: string }) {
    let profile = await repo.getProfile(ctx.db, ctx.userId);
    if (!profile) {
      profile = await repo.upsertProfile(ctx.db, {
        userId: ctx.userId,
        email: ctx.email,
      });
    }
    if (!profile) {
      throw appError(ErrCode.Internal, "Failed to hydrate profile");
    }
    // Every authenticated user is guaranteed a default workspace. Lazy-create
    // on first me() call so OAuth users (who skip the setup form) still get one.
    const workspaceId = await ensureUserWorkspace(ctx.db, ctx.userId);
    if (profile.defaultWorkspaceId !== workspaceId) {
      profile = { ...profile, defaultWorkspaceId: workspaceId };
    }
    return {
      profile,
      workspaceId,
      onboardingCompleted: profile.onboardingCompletedAt !== null,
    };
  },

  async completeOnboarding(
    ctx: BaseCtx & { email: string },
    input: CompleteOnboardingInput,
  ) {
    // Make sure the profile row exists before we update it.
    let profile = await repo.getProfile(ctx.db, ctx.userId);
    if (!profile) {
      profile = await repo.upsertProfile(ctx.db, {
        userId: ctx.userId,
        email: ctx.email,
        fullName: input.name,
      });
    }
    if (!profile) {
      throw appError(ErrCode.Internal, "Failed to hydrate profile");
    }

    const workspaceId = await ensureUserWorkspace(ctx.db, ctx.userId);

    const updated = await repo.completeOnboarding(ctx.db, {
      userId: ctx.userId,
      name: input.name,
      defaultWorkspaceId: workspaceId,
      hearAboutUs: input.hearAboutUs,
      role: input.role,
      otherRole: input.otherRole,
    });
    if (!updated) {
      throw appError(ErrCode.Internal, "Failed to complete onboarding");
    }

    return { profile: updated, workspaceId, onboardingCompleted: true };
  },
};
