import { router } from "../../trpc/init";
import { protectedProc, workspaceProc } from "../../trpc/middleware";

import { completeOnboardingInput, syncProfileInput } from "./inputs";
import { authService } from "./service";

export const authRouter = router({
  syncProfile: protectedProc
    .input(syncProfileInput)
    .mutation(({ ctx, input }) =>
      authService.syncProfile({ db: ctx.db, userId: ctx.user.id }, input),
    ),

  me: workspaceProc.query(({ ctx }) =>
    authService.me({
      db: ctx.db,
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
          db: ctx.db,
          userId: ctx.user.id,
          workspaceId: ctx.workspaceId,
          email: ctx.user.email,
        },
        input,
      ),
    ),
});
