import { router } from "../../trpc/init";
import { protectedProc } from "../../trpc/middleware";

import { completeOnboardingInput, syncProfileInput } from "./inputs";
import { authService } from "./service";

export const authRouter = router({
  syncProfile: protectedProc
    .input(syncProfileInput)
    .mutation(({ ctx, input }) =>
      authService.syncProfile({ db: ctx.db, userId: ctx.user.id }, input),
    ),
  me: protectedProc.query(({ ctx }) =>
    authService.me({ db: ctx.db, userId: ctx.user.id, email: ctx.user.email }),
  ),
  completeOnboarding: protectedProc
    .input(completeOnboardingInput)
    .mutation(({ ctx, input }) =>
      authService.completeOnboarding(
        { db: ctx.db, userId: ctx.user.id, email: ctx.user.email },
        input,
      ),
    ),
});
