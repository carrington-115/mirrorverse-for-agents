import { getDb } from "@mirrorverse/db";

import { router } from "../../trpc/init";
import { protectedProc, workspaceProc } from "../../trpc/middleware";

import { completeOnboardingInput, syncProfileInput } from "./inputs";
import { authService } from "./service";

// `user_profiles` is a per-user bootstrap table, not workspace-scoped, so it is
// intentionally outside RLS (issue #31). These procedures only read/write the
// caller's own profile, so they run on the privileged connection (getDb) rather
// than the workspace-scoped runtime transaction — matching ensureUserWorkspace,
// which also touches profiles RLS-bypassed. workspaceProc is still used on `me`
// and `completeOnboarding` purely to resolve ctx.workspaceId.
export const authRouter = router({
  syncProfile: protectedProc
    .input(syncProfileInput)
    .mutation(({ ctx, input }) =>
      authService.syncProfile({ db: ctx.db, userId: ctx.user.id }, input),
    ),

  me: workspaceProc.query(({ ctx }) =>
    authService.me({
      db: getDb(),
      userId: ctx.user.id,
      workspaceId: ctx.workspaceId,
      email: ctx.user.email,
    }),
  ),

  completeOnboarding: workspaceProc
    .input(completeOnboardingInput)
    .mutation(({ ctx, input }) =>
      authService.completeOnboarding(
        {
          db: getDb(),
          userId: ctx.user.id,
          workspaceId: ctx.workspaceId,
          email: ctx.user.email,
        },
        input,
      ),
    ),
});
