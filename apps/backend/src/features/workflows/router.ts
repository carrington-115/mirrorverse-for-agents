import { router } from "../../trpc/init";
import { protectedProc } from "../../trpc/middleware";

import { getWorkflowInput, listWorkflowsInput } from "./inputs";
import { workflowsService } from "./service";

export const workflowsRouter = router({
  list: protectedProc
    .input(listWorkflowsInput)
    .query(({ ctx, input }) =>
      workflowsService.list({ db: ctx.db, userId: ctx.user.id }, input),
    ),

  get: protectedProc
    .input(getWorkflowInput)
    .query(({ ctx, input }) =>
      workflowsService.get({ db: ctx.db, userId: ctx.user.id }, input),
    ),
});
