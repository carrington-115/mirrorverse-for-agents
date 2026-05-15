import { router } from "../../trpc/init";
import { workspaceProc } from "../../trpc/middleware";

import {
  deleteWorkflowInput,
  getWorkflowInput,
  getWorkflowVersionInput,
  listWorkflowVersionsInput,
  listWorkflowsInput,
  renameWorkflowInput,
  reorderWorkflowsInput,
} from "./inputs";
import { workflowsService } from "./service";

export const workflowsRouter = router({
  list: workspaceProc
    .input(listWorkflowsInput)
    .query(({ ctx, input }) =>
      workflowsService.list(
        { db: ctx.db, workspaceId: ctx.workspaceId },
        input,
      ),
    ),

  get: workspaceProc
    .input(getWorkflowInput)
    .query(({ ctx, input }) =>
      workflowsService.get({ db: ctx.db, workspaceId: ctx.workspaceId }, input),
    ),

  listVersions: workspaceProc
    .input(listWorkflowVersionsInput)
    .query(({ ctx, input }) =>
      workflowsService.listVersions(
        { db: ctx.db, workspaceId: ctx.workspaceId },
        input,
      ),
    ),

  getVersion: workspaceProc
    .input(getWorkflowVersionInput)
    .query(({ ctx, input }) =>
      workflowsService.getVersion(
        { db: ctx.db, workspaceId: ctx.workspaceId },
        input,
      ),
    ),

  delete: workspaceProc
    .input(deleteWorkflowInput)
    .mutation(({ ctx, input }) =>
      workflowsService.delete(
        { db: ctx.db, workspaceId: ctx.workspaceId },
        input,
      ),
    ),

  rename: workspaceProc
    .input(renameWorkflowInput)
    .mutation(({ ctx, input }) =>
      workflowsService.rename(
        { db: ctx.db, workspaceId: ctx.workspaceId },
        input,
      ),
    ),

  reorder: workspaceProc
    .input(reorderWorkflowsInput)
    .mutation(({ ctx, input }) =>
      workflowsService.reorder(
        { db: ctx.db, workspaceId: ctx.workspaceId },
        input,
      ),
    ),
});
