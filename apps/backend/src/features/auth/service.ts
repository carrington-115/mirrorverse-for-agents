import type { Database } from "@mirrorverse/db";
import type { UserId } from "@mirrorverse/types";

import { appError, ErrCode } from "../../lib/errors";

import * as repo from "./repo";
import type { SyncProfileInput } from "./inputs";

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
    return { profile };
  },
};
