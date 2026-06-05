import type { Database } from "@mirrorverse/db";
import type { UserId } from "@mirrorverse/types";

import { appError, ErrCode } from "../../lib/errors";
import { sendWelcomeEmail } from "../notifications/email";

import * as repo from "./repo";
import type { CompleteOnboardingInput, SyncProfileInput } from "./inputs";

interface UserCtx {
  readonly db: Database;
  readonly userId: UserId;
}

interface WorkspaceCtx extends UserCtx {
  readonly workspaceId: string;
  readonly email: string;
}

export const authService = {
  async syncProfile(ctx: UserCtx, input: SyncProfileInput) {
    return repo.upsertProfile(ctx.db, {
      userId: ctx.userId,
      email: input.email,
      fullName: input.fullName,
      avatarUrl: input.avatarUrl,
    });
  },

  async me(ctx: WorkspaceCtx) {
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
    if (profile.defaultWorkspaceId !== ctx.workspaceId) {
      profile = { ...profile, defaultWorkspaceId: ctx.workspaceId };
    }
    return {
      profile,
      workspaceId: ctx.workspaceId,
      onboardingCompleted: profile.onboardingCompletedAt !== null,
    };
  },

  async completeOnboarding(ctx: WorkspaceCtx, input: CompleteOnboardingInput) {
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

    const updated = await repo.completeOnboarding(ctx.db, {
      userId: ctx.userId,
      name: input.name,
      defaultWorkspaceId: ctx.workspaceId,
      hearAboutUs: input.hearAboutUs,
      role: input.role,
      otherRole: input.otherRole,
    });
    if (!updated) {
      throw appError(ErrCode.Internal, "Failed to complete onboarding");
    }

    // Fire-and-forget: welcome email doesn't block the onboarding response
    sendWelcomeEmail(ctx.email, input.name, ctx.userId).catch((err) =>
      console.error("[auth] sendWelcomeEmail failed:", err),
    );

    return {
      profile: updated,
      workspaceId: ctx.workspaceId,
      onboardingCompleted: true,
    };
  },
};
